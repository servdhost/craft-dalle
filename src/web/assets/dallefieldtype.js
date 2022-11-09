//Hook the dall-e generate form

let globalAjaxAborter = new AbortController();

let $editModalWrapper = $('<div class="modal" style="overflow:auto;height:100%;"><div id="modal" class="body"><header class="header"><h2>Dall-E Generator</h2></header><div class="dalle-modal-content"></div></div></div>');
let $editModalContent = $editModalWrapper.find('.dalle-modal-content');
$editModalContent.append($(
    `<div class="modal-input-wrapper">
        <div style="display: flex">
            <div style="flex-grow: 1; padding-right: 10px;">
                <input type="text" class="dalle-prompt text fullwidth" autocomplete="off" placeholder="Prompt..." dir="ltr">
            </div>
        <div>
        <button type="button" class="dalle-generate-button btn"><div class="label">Generate</div></button>
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

$editModalDetailsWrapper = $(`
    <div class="modal-details-wrapper">
        <div class="modal-details-lhs">
            <div class="modal-details-lhs-img">
                <img src="">
            </div>
            <button class="submit btn modal-details-use">Use this</button>
            <button class="btn modal-details-variants">Generate variants</button>
            <button class="btn modal-details-extend">Extend horizontally</button>
            <button class="btn modal-details-back">Back</button>
        </div>
        <div class="modal-details-rhs">
            
        </div>
    </div>
`);

let $editModalDetailsRhs = $editModalDetailsWrapper.find('.modal-details-rhs');

$editModalDetailsWrapper.find('.modal-details-back').click(function(e){
    cancelInflight();
    closeDetails();
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

$editModalDetailsWrapper.hide();
$editModalContent.append($editModalDetailsWrapper);

let $editModalPromptInput = $editModalContent.find('.dalle-prompt');
let $editModalPromptButton = $editModalContent.find('.dalle-generate-button');

$editModalPromptButton.click(function(e){
    cancelInflight();
    performNewGeneration($editModalPromptInput.val());
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
    let fieldId = activeGenerator.getAttribute('data-fieldid');
    let useData = {
        imageUrl: $editModalDetailsWrapper.attr('data-url'),
        fieldId,
    }

    let useUrl = Craft.actionUrl + 'craft-dalle/dall-e-field/use-image&' + new URLSearchParams(useData);
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
        //TODO undo any loading state set when saving the image
    });
}

function selectImagePair(leftImageUrl, rightImageUrl) {
    let fieldId = activeGenerator.getAttribute('data-fieldid');
    let useData = {
        leftImageUrl,
        rightImageUrl,
        fieldId,
    }

    let useUrl = Craft.actionUrl + 'craft-dalle/dall-e-field/use-image-pair&' + new URLSearchParams(useData);
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
        //TODO undo any loading state set when saving the image
    });
}


function performNewGeneration(prompt) {
    clearModal();
    resultsLoading();
    let count = 4;
    let data = {
        fieldId: activeGenerator.getAttribute('data-fieldid'),
        prompt,
        count
    }

    let generateUrl = Craft.actionUrl + 'craft-dalle/dall-e-field/generate-images&' + new URLSearchParams(data);

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
        populateResults(data.urls);
    }).catch(error => {
        displayFetchErrors(error);
        setTimeout(function(){ //Gives the XHR request a chance to cleanly close before the abort is fired
            clearModal(true);
        }, 100);
    });
}

function populateResults(urls) {

    clearModal();

    for (imageUrl of urls) {
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
        count: 3
    }
    let varyUrl = Craft.actionUrl + 'craft-dalle/dall-e-field/generate-variants&' + new URLSearchParams(varyData);
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
        count: 4
    }

    let extendUrl = Craft.actionUrl + 'craft-dalle/dall-e-field/extend-horizontally&' + new URLSearchParams(extendData);
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

function handleFetchErrors(response) {
    if (!response.ok) {
        throw response;
    }
    return response;
}

function displayFetchErrors(error) {
    if (error.text) { //This is an HTTP reponse
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