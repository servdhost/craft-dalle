(function(){
    let globalAjaxAborter = new AbortController();

    let allImageUrls = [];

    let $editModalWrapper = $('<div class="modal" style="overflow:auto;height:100%;"><div class="modal-saving-wrapper"><div>Saving your creation...</div></div><div id="modal" class="body"><header class="header"><h2>Dall-E Generator</h2></header><div class="dalle-modal-content"></div></div></div>');
    let $editModalContent = $editModalWrapper.find('.dalle-modal-content');
    $editModalContent.append($(
        `<div class="modal-input-wrapper">
            <div style="display: flex">
                <div style="flex-grow: 1; padding-right: 10px;">
                    <input type="text" class="dalle-prompt text fullwidth" autocomplete="off" placeholder="Prompt..." dir="ltr">
                </div>
            <div>
            <button type="button" class="dalle-generate-button btn"><div class="label">Generate New</div></button>
        </div>`)
    );

    let $editModalResultsWrapper = $(`
        <div class="modal-results-wrapper">
            <div class="modal-results-placeholder">
                <p>A cat wearing a raincoat?</p>
                <p>Twelve 50p coins all showing heads?</p>
                <p>A scene from a scary movie?</p>
            </div>
        </div>
    `);
    $editModalContent.append($editModalResultsWrapper);

    let $editModalSavingWrapper = $editModalWrapper.find('.modal-saving-wrapper').first();
    $editModalSavingWrapper.hide();

    $editModalDetailsWrapper = $(`
        <div class="modal-details-wrapper">
            <div class="modal-details-lhs">
                <div class="modal-details-lhs-zoom">
                    <div class="modal-details-lhs-zoom-inner">
                        <img src="">
                    </div>
                </div>
                <div class="modal-details-lhs-img">
                    <img src="">
                </div>
                <button class="submit btn modal-details-use">Use this</button>
                <button class="btn modal-details-variants">Generate variants</button>
                <button class="btn modal-details-repaint">Spot repaint</button>
                <button class="btn modal-details-extend">Extend horizontally</button>
                <button class="btn modal-details-back">Back to all images</button>
            </div>
            <div class="modal-details-rhs">
                
            </div>
        </div>
    `);

    let $editModalDetailsRhs = $editModalDetailsWrapper.find('.modal-details-rhs');

    let $editModalDetailsLhsImg = $editModalDetailsWrapper.find('.modal-details-lhs-img').first();
    let $editModalDetailsLhsImgZoom = $editModalDetailsWrapper.find('.modal-details-lhs-zoom').first();
    let $editModalDetailsLhsImgZoomInner = $editModalDetailsLhsImgZoom.find('.modal-details-lhs-zoom-inner').first();

    if($(window).width() >= 520) {
        $editModalDetailsLhsImg.hover(function(e){
            $editModalDetailsLhsImgZoom.show();
        }, function(e){
            $editModalDetailsLhsImgZoom.hide();
        });

        $editModalDetailsLhsImg.mousemove(function(e){
            let target = $(e.currentTarget);
            let mouseX = e.originalEvent.x;
            let mouseY = e.originalEvent.y;

            let offsetX = (mouseX - target.offset().left) / target.width();
            let offsetY = (mouseY - target.offset().top) / target.height();
            
            let zoomX = (-100) * offsetX;
            let zoomY = (-100) * offsetY;

            $editModalDetailsLhsImgZoomInner.css('left', zoomX + '%')
            $editModalDetailsLhsImgZoomInner.css('top', zoomY + '%')

        })
    }

    $editModalDetailsWrapper.find('.modal-details-back').click(function(e){
        cancelInflight();
        populateResults();

    });

    $editModalDetailsWrapper.find('.modal-details-use').click(function(e){
        cancelInflight();
        selectImage($editModalDetailsWrapper.attr('data-url'));
    });

    $editModalDetailsWrapper.find('.modal-details-variants').click(function(e){
        cancelInflight();
        generateVariants($editModalDetailsWrapper.attr('data-url'));
    });

    $editModalDetailsWrapper.find('.modal-details-extend').click(function(e){
        cancelInflight();
        generateExtensions($editModalDetailsWrapper.attr('data-url'));
    });

    $editModalDetailsWrapper.find('.modal-details-repaint').click(function(e){
        cancelInflight();
        gotoRepaint($editModalDetailsWrapper.attr('data-url'));
    });

    $editModalDetailsWrapper.hide();
    $editModalContent.append($editModalDetailsWrapper);

    let $editModalPromptInput = $editModalContent.find('.dalle-prompt');
    let $editModalPromptButton = $editModalContent.find('.dalle-generate-button');

    $editModalPromptButton.click(function(e){
        clearModal();
        setTimeout(function(){
            performNewGeneration($editModalPromptInput.val());
        }, 100)
    })

    let editModal = new Garnish.Modal($editModalWrapper, {
        autoShow: false
    });

    let activeGenerator = null;

    let generators = document.getElementsByClassName('dalle-generator');
    for (generator of generators) {
        let launchButton = generator.getElementsByClassName('dalle-generate-button')[0];
        if(!launchButton) continue;
        
        launchButton.addEventListener('click', function(e){
            triggerModal($(this).parents('.dalle-generator')[0]);
        });

        let fieldId = generator.getAttribute('data-fieldid');
        setInterval(function(){
            let limit = window.dalle[fieldId].settings.limit;
            if (limit != null && window.dalle[fieldId].$elements.length >= limit) {
                $(launchButton).hide();
            } else {
                $(launchButton).show();
            }
        }, 200);
    }

    function cancelInflight(){
        globalAjaxAborter.abort();
        globalAjaxAborter = new AbortController();
    }

    function showModal(){
        editModal.show();
    }

    function hideModal(){
        cancelInflight();
        editModal.hide();
    }

    function resetModal() {
        $editModalSavingWrapper.hide();
        cancelInflight();
        $editModalPromptInput.val('');
        clearModal(true);
    }

    function clearModal(showPlaceholder = false) {
        cancelInflight();
        closeDetails();
        if (showPlaceholder) {
            setResultsToPlaceholder();
        } else {
            clearResults();
        }
    }

    function setResultsToPlaceholder() {
        clearResults();
        $editModalResultsWrapper.append($(`
        <div class="modal-results-placeholder">
                <p>A cat wearing a raincoat?</p>
                <p>Twelve 50p coins all showing heads?</p>
                <p>A scene from a scary movie?</p>
            </div>
        `));
    }

    function showSaving() {
        $editModalDetailsWrapper.hide();
        $editModalResultsWrapper.hide();
        $editModalSavingWrapper.show();
    }

    function clearResults() {
        $editModalResultsWrapper.empty();
    }

    function resultsLoading() {
        clearResults();
        let loading = $('<div class="dalle-spinner"><div class="animation"></div></div>');
        $editModalResultsWrapper.append(loading);
    }

    function detailsRHSLoading() {
        clearDetailsRHS();
        let loading = $('<div class="dalle-spinner"><div class="animation"></div></div>');
        $editModalDetailsRhs.append(loading);
    }

    function triggerModal(generator) {
        activeGenerator = generator;
        resetModal();
        showModal();
    }

    function closeDetails() {
        $editModalDetailsWrapper.hide();
        $editModalResultsWrapper.show();
    }

    function showDetails(imageUrl) {
        $editModalResultsWrapper.hide();
        $editModalDetailsWrapper.find('.modal-details-lhs img').attr('src', imageUrl);
        $editModalDetailsWrapper.attr('data-url', imageUrl);
        $editModalDetailsWrapper.show();
        clearDetailsRHS();
    }

    function clearDetailsRHS() {
        $editModalDetailsRhs.empty();
    }

    function selectImage(imageUrl) {
        showSaving();
        let fieldId = activeGenerator.getAttribute('data-fieldid');
        let useData = {
            imageUrl: $editModalDetailsWrapper.attr('data-url'),
            fieldId,
        }

        let useUrl = createActionUrl('craft-dalle/dall-e-field/use-image', useData);
        fetch(useUrl, {
            method: 'GET',
            mode: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow', 
            signal: globalAjaxAborter.signal   
        }).then(handleFetchErrors)
        .then((response) => response.json()).then((data) => {

            let elementId = data.assetId;
            let title = data.title;
            let siteId = data.siteId;
            let imageUrl = data.imageUrl;

            let elementString = `<div 
                class="element large hasthumb" 
                data-kind="image" 
                data-image-width="2200" 
                data-image-height="1467" 
                data-peer-file="" 
                data-movable="" 
                data-replaceable="" 
                data-type="craft\elements\Asset" 
                data-status="enabled" 
                data-settings="{&quot;context&quot;:&quot;modal&quot;,&quot;size&quot;:&quot;large&quot;,&quot;showStatus&quot;:false,&quot;showThumb&quot;:true,&quot;showLabel&quot;:true,&quot;showDraftName&quot;:true}" 
                data-editable=""
            >
                <div class="elementthumb checkered" data-sizes="120px" data-srcset="${imageUrl} 120w">
                    <img sizes="120px" srcset="${imageUrl} 120w" alt="">
                </div>
                <div class="label"><span class="title">${title}</span></div>
            </div>`;

            let element = $(elementString);
            element.data('id', elementId);
            element.data('url', imageUrl);
            element.data('site-id', siteId);
            element.data('label', title);
            element.attr('title', title);

            let elements = [
                {
                    id: elementId,
                    $element: element
                }
            ]
            window.dalle[fieldId].selectElements(elements)
            hideModal();
            resetModal();
        }).catch(error => {
            displayFetchErrors(error);
            $editModalSavingWrapper.hide();
            $editModalDetailsWrapper.show();
            //TODO undo any loading state set when saving the image
        });
    }

    function selectImagePair(leftImageUrl, rightImageUrl) {
        showSaving();
        let fieldId = activeGenerator.getAttribute('data-fieldid');
        let useData = {
            leftImageUrl,
            rightImageUrl,
            fieldId,
        }

        let useUrl = createActionUrl('craft-dalle/dall-e-field/use-image-pair', useData);
        fetch(useUrl, {
            method: 'GET',
            mode: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',    
            signal: globalAjaxAborter.signal
        
        }).then(handleFetchErrors)
        .then((response) => response.json()).then((data) => {

            let elementId = data.assetId;
            let title = data.title;
            let siteId = data.siteId;
            let imageUrl = data.imageUrl;

            let elementString = `<div 
                class="element large hasthumb" 
                data-kind="image" 
                data-image-width="2200" 
                data-image-height="1467" 
                data-peer-file="" 
                data-movable="" 
                data-replaceable="" 
                data-type="craft\elements\Asset" 
                data-status="enabled" 
                data-settings="{&quot;context&quot;:&quot;modal&quot;,&quot;size&quot;:&quot;large&quot;,&quot;showStatus&quot;:false,&quot;showThumb&quot;:true,&quot;showLabel&quot;:true,&quot;showDraftName&quot;:true}" 
                data-editable=""
            >
                <div class="elementthumb checkered" data-sizes="120px" data-srcset="${imageUrl} 120w">
                    <img sizes="120px" srcset="${imageUrl} 120w" alt="">
                </div>
                <div class="label"><span class="title">${title}</span></div>
            </div>`;

            let element = $(elementString);
            element.data('id', elementId);
            element.data('url', imageUrl);
            element.data('site-id', siteId);
            element.data('label', title);
            element.attr('title', title);

            let elements = [
                {
                    id: elementId,
                    $element: element
                }
            ]
            window.dalle[fieldId].selectElements(elements)
            hideModal();
            resetModal();
        }).catch(error => {
            displayFetchErrors(error);
            $editModalSavingWrapper.hide();
            $editModalDetailsWrapper.show();
            //TODO undo any loading state set when saving the image
        });
    }


    function performNewGeneration(prompt) {
        clearModal();
        resultsLoading();
        let data = {
            fieldId: activeGenerator.getAttribute('data-fieldid'),
            prompt,
        }

        let generateUrl = createActionUrl('craft-dalle/dall-e-field/generate-images', data);
        fetch(generateUrl, {
            method: 'GET',
            mode: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',  
            signal: globalAjaxAborter.signal  
        }).then(handleFetchErrors)
        .then((response) => response.json()).then((data) => {
            allImageUrls = data.urls.concat(allImageUrls);
            populateResults();
        }).catch(error => {
            displayFetchErrors(error);
            setTimeout(function(){ //Gives the XHR request a chance to cleanly close before the abort is fired
                clearModal(true);
            }, 100);
        });
    }

    function populateResults() {

        clearModal();

        for (imageUrl of allImageUrls) {
            let $item = $(`
            <div class="dalle-preview-item" data-url="${imageUrl}">
                <div class="dalle-preview-item-inner">
                    <img src="${imageUrl}">
                    <div class="dalle-preview-item-buttons">
                        <button type="button" class="btn dalle-view-button">Select</button>
                    </div>
                </div>
            </div>
            `);
            
            let fieldId = activeGenerator.getAttribute('data-fieldid');
            $editModalResultsWrapper.append($item);

            $item.find('.dalle-view-button').click(function(e){
                showDetails($(this).parents('.dalle-preview-item').first().attr('data-url'));
            });
        }
    }

    function generateVariants(imageUrl) {
        
        detailsRHSLoading();

        let varyData = {
            imageUrl,
        }
        
        let varyUrl = createActionUrl('craft-dalle/dall-e-field/generate-variants', varyData);
        fetch(varyUrl, {
            method: 'GET',
            mode: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',    
            signal: globalAjaxAborter.signal
        }).then(handleFetchErrors)
        .then((response) => response.json()).then((data) => {
            allImageUrls = data.urls.concat(allImageUrls);
            populateVaryResults(data.urls);
        }).catch(error => {
            displayFetchErrors(error);
            setTimeout(function(){ //Gives the XHR request a chance to cleanly close before the abort is fired
                clearDetailsRHS();
            }, 100);
        });
    }

    function populateVaryResults(urls) {
        clearDetailsRHS();
        $varyResultsWrapper = $('<div class="dalle-vary-results"></div>');

        for (imageUrl of urls) {
            let $item = $(`
            <div class="dalle-vary-result" data-url="${imageUrl}">
                <div class="dalle-vary-result-img">
                    <img src="${imageUrl}">
                </div>
                <button data-url="${imageUrl}" class="btn dalle-vary-select-button">Select</button>
            </div>
            `);

            $item.find('.dalle-vary-select-button').click(function(e){
                showDetails($(this).data('url'));
            })
            $varyResultsWrapper.append($item);
        }

        $editModalDetailsRhs.append($varyResultsWrapper);

    }

    function generateExtensions(imageUrl) {

        detailsRHSLoading();

        let extendData = {
            imageUrl,
            prompt: $editModalPromptInput.val(),
            fieldId: activeGenerator.getAttribute('data-fieldid'),
        }

        let extendUrl = createActionUrl('craft-dalle/dall-e-field/extend-horizontally', extendData);
        fetch(extendUrl, {
            method: 'GET',
            mode: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',    
            signal: globalAjaxAborter.signal
        }).then(handleFetchErrors)
        .then((response) => response.json()).then((data) => {
            populateExtensions(data.left, data.right);
        }).catch(error => {
            displayFetchErrors(error);
            setTimeout(function(){ //Gives the XHR request a chance to cleanly close before the abort is fired
                clearDetailsRHS();
            }, 100);
        });
    }

    function populateExtensions(leftUrls, rightUrls) {
        clearDetailsRHS();
        let $wrapper = $('<div class="dalle-extensions-wrapper"></div>');
        let $headings = $(
            `<div class="dalle-extensions-headings heading">
                <legend class="">Select a left side</legend>
                <legend class="">Select a right side</legend>
            </div>`
        );
        $wrapper.append($headings);

        $selectButtonWrapper = $('<div class="dalle-use-extensions-button-wrapper"></div>');
        $selectButton = $('<button type="button" disabled class="submit btn dalle-use-extensions-button disabled">Use selected pair</button>');
        $selectButtonWrapper.append($selectButton);

        for (let i = 0; i<leftUrls.length; i++) {
            let leftUrl = leftUrls[i];
            let rightUrl = rightUrls[i];
            $row = $(`
            <div class="dalle-extensions-row">
                <a class="dalle-extensions-item dalle-extensions-item-left" data-url="${leftUrl}">
                    <div class="inner-shadow"></div>
                    <img src="${leftUrl}">
                </a>
                <a class="dalle-extensions-item dalle-extensions-item-right" data-url="${rightUrl}">
                    <div class="inner-shadow"></div>
                    <img src="${rightUrl}">
                </a>
            </div>
            `);
            $wrapper.append($row);

            $row.find('.dalle-extensions-item').click(function(e){
                let button = $(this);
                if (button.hasClass('dalle-extensions-item-left')) {
                    $wrapper.data('selected-left', button.data('url'));
                    $wrapper.find('.dalle-extensions-item-left.selected').removeClass('selected');
                    button.addClass('selected');
                }
                if (button.hasClass('dalle-extensions-item-right')) {
                    $wrapper.data('selected-right', button.data('url'));
                    $wrapper.find('.dalle-extensions-item-right.selected').removeClass('selected');
                    button.addClass('selected');
                }

                if($wrapper.data('selected-left') && $wrapper.data('selected-right')) {
                    $selectButton.prop("disabled", false);
                    $selectButton.removeClass('disabled');
                } else {
                    $selectButton.prop("disabled", true);
                    $selectButton.addClass('disabled');
                }

            });

        }
        $editModalDetailsRhs.append($wrapper);
        $editModalDetailsRhs.append($selectButtonWrapper);

        $selectButton.click(function(e){
            cancelInflight();
            selectImagePair($wrapper.data('selected-left'), $wrapper.data('selected-right'));
        })
    }

    function gotoRepaint(imageUrl) {
        clearDetailsRHS();
        //Create DON for image repainting
        $repaintDom = $(`
            <div class="dalle-repaint">
                <p>Click and drag to select the area to repaint</p>
                <div class="dalle-repaint-canvas">
                    <img src="">
                    <canvas></canvas>
                </div>
                <div class="dalle-repaint-buttons">
                    <button class="btn dalle-repaint-clear-button">Reset</button>    
                    <button class="btn dalle-repaint-button">Repaint Selected</button>
                </div>
            </div>
        `);

        $repaintCanvas = $($repaintDom).find('.dalle-repaint-canvas');

        $repaintDom.find('img').prop('src', imageUrl);
        let canvas = $repaintDom.find('canvas')[0];
        var ctx = canvas.getContext("2d");
        
        let $repaintButton = $repaintDom.find('.dalle-repaint-button');
        let $clearButton = $repaintDom.find('.dalle-repaint-clear-button');

        $editModalDetailsRhs.append($repaintDom);

        ctx.canvas.width = $repaintDom.width();
        ctx.canvas.height = $repaintDom.width();
        ctx.strokeStyle = 'red'
        ctx.lineCap = 'round';
        ctx.round = "round";
        ctx.lineWidth = 30;
        let drawing = false;

        let lastX, lastY = 0;

        $repaintCanvas.mousedown(function(e){
            drawing = true;
            ctx.beginPath();
        });
        $repaintCanvas.mouseup(function(e){
            drawing = false;
            lastX = 0,
            lastY = 0;
        });

        $repaintCanvas.mousemove(function(e){
            if (drawing) {
                let xPos = e.originalEvent.x - $repaintCanvas.offset().left;
                let yPos = (e.originalEvent.y - $repaintCanvas.offset().top) + $(document).scrollTop();

                console.log(e.originalEvent);
                console.log($repaintCanvas.offset())

                if (lastX > 0 && lastY > 0) {
                    ctx.moveTo(lastX, lastY);
                    ctx.lineTo(xPos, yPos);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(xPos, yPos, 5, 0, 2 * Math.PI, false);
                    ctx.closePath();
                }
                lastX = xPos,
                lastY = yPos;
            }
        });

        $repaintButton.click(function(e){
            let dataUrl = canvas.toDataURL("image/png");
            generateRepaint(imageUrl, dataUrl);
        });

        $clearButton.click(function(e){
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        })

    }

    function generateRepaint(imageUrl, maskData) {
        detailsRHSLoading();

        let extendData = {
            imageUrl,
            prompt: $editModalPromptInput.val(),
            fieldId: activeGenerator.getAttribute('data-fieldid'),
            maskData: maskData,
        }

        extendData[Craft.csrfTokenName] = Craft.csrfTokenValue;

        let extendUrl = createActionUrl('craft-dalle/dall-e-field/repaint', []);
        fetch(extendUrl, {
            method: 'POST',
            mode: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(extendData),
            redirect: 'follow',    
            signal: globalAjaxAborter.signal
        }).then(handleFetchErrors)
        .then((response) => response.json()).then((data) => {
            allImageUrls = data.urls.concat(allImageUrls);
            populateVaryResults(data.urls);
        }).catch(error => {
            displayFetchErrors(error);
            setTimeout(function(){ //Gives the XHR request a chance to cleanly close before the abort is fired
                clearDetailsRHS();
            }, 100);
        });
    }

    function handleFetchErrors(response) {
        if (!response.ok) {
            throw response;
        }
        return response;
    }

    function displayFetchErrors(error) {
        if (error.name && error.name == 'AbortError') { 
            Craft.cp.displayError('Request cancelled');
        } else if (error.text) { //This is an HTTP reponse
            error.text().then(text => {
                try{
                    let parsed = JSON.parse(text); //Is it JSON?
                    if (parsed.hasOwnProperty('message')) { //Does it have a message?
                        Craft.cp.displayError(parsed.message);
                    } else {
                        Craft.cp.displayError('An unknown error occurred.');
                    }
                } catch(e) {
                    Craft.cp.displayError(text); //Failed parsing JSON, output body
                }
            });
        } else {
            Craft.cp.displayError('An unknown error occurred.'); //Some other error
        }
    }

    function createActionUrl(path, queryData) {
        let baseUrl = Craft.actionUrl.replace(/\/+$/, '');
        let fullUrl = baseUrl + '/' + path;
        if (fullUrl.indexOf('?') >= 0) {
            fullUrl += '&'
        } else {
            fullUrl += '?'
        }
        return fullUrl + new URLSearchParams(queryData);
    }
})();