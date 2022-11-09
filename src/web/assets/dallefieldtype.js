//Hook the dall-e generate form

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

$editModalResultsWrapper = $('<div class="modal-results-wrapper"></div>');
$editModalContent.append($editModalResultsWrapper);

$editModalExtensionsWrapper = $('<div class="modal-extensions-wrapper"></div>');
$editModalContent.append($editModalExtensionsWrapper);

let $editModalPromptInput = $editModalContent.find('.dalle-prompt');
let $editModalPromptButton = $editModalContent.find('.dalle-generate-button');

$editModalPromptButton.click(function(e){
    performNewGeneration($editModalPromptInput.val());
})

let editModal = new Garnish.Modal($editModalWrapper, {
    autoShow: false
});

let activeGenerator = null;

let generators = document.getElementsByClassName('dalle-generator');
for (generator of generators) {
    let launchButton = generator.getElementsByClassName('dalle-generate-button')[0];
    // let promptInput = generator.getElementsByClassName('dalle-prompt')[0];
    // let fieldId = generator.getAttribute('data-fieldid');
    // let resultsPane = generator.getElementsByClassName('dalle-results-pane')[0];
    // let resultsContainer = resultsPane.getElementsByClassName('dalle-results')[0];
    // let extensionsPane = generator.getElementsByClassName('dalle-extensions-pane')[0];
    // let extensionsContainer = extensionsPane.getElementsByClassName('dalle-extensions-results')[0];
    // console.log(resultsContainer);

    if(!launchButton) continue;
    
    launchButton.addEventListener('click', function(e){
        triggerModal(generator);
        
        // Clear any existing results
        // resultsContainer.innerHTML = "";

        // let prompt = promptInput.value;
        // let count = 4;
        // let data = {
        //     fieldId,
        //     prompt,
        //     count
        // }
        
        // let generateUrl = Craft.actionUrl + 'craft-dalle/dall-e-field/generate-images&' + new URLSearchParams(data);
        
        // fetch(generateUrl, {
        //     method: 'GET',
        //     mode: 'same-origin',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     redirect: 'follow',    
        // }).then((response) => response.json()).then((data) => {
            
        //     triggerModal(generator, data.urls);
        //     //populateResults(generator, data.urls);
            
        // });

    });
}

// function populateResults(generator, urls)
// {
//     let promptInput = generator.getElementsByClassName('dalle-prompt')[0];
//     let fieldId = generator.getAttribute('data-fieldid');
//     let resultsPane = generator.getElementsByClassName('dalle-results-pane')[0];
//     let resultsContainer = $('<div></div>'); //resultsPane.getElementsByClassName('dalle-results')[0];
//     let extensionsPane = generator.getElementsByClassName('dalle-extensions-pane')[0];
//     let extensionsContainer = extensionsPane.getElementsByClassName('dalle-extensions-results')[0];
    
//     resultsContainer.innerHTML = '';

//     var $div = $('<div class="modal"></div>');

//     for (imageUrl of urls) {
//         let wrapper = document.createElement('div');
//         wrapper.classList.add('dalle-preview-item');

//         let img = document.createElement('img');
//         img.setAttribute('src', imageUrl);

//         let buttonHolder = document.createElement('div');
//         buttonHolder.classList.add('dalle-preview-item-buttons');

//         let useButton = document.createElement('button');
//         useButton.setAttribute('type', 'button');
//         useButton.classList.add('btn');
//         //useButton.classList.add('');
//         useButton.innerHTML = 'Use this';

//         let useData = {
//             imageUrl,
//             fieldId
//         }
//         useButton.addEventListener('click', function(e){
//             let useUrl = Craft.actionUrl + 'craft-dalle/dall-e-field/use-image&' + new URLSearchParams(useData);
//             fetch(useUrl, {
//                 method: 'GET',
//                 mode: 'same-origin',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 redirect: 'follow',    
//             }).then((response) => response.json()).then((data) => {

//                 // Need to load it into the asset selector
//                 // 'Element' are objects which looks like this:
//                 /*
//                  return {
//                     id: $element.data('id'),
//                     siteId: $element.data('site-id'),
//                     label: $element.data('label'),
//                     status: $element.data('status'),
//                     url: $element.data('url'),
//                     hasThumb: $element.hasClass('hasthumb'),
//                     $element: $element,
//                     };
//                     */
//                 // $element is a DOM element we might need to build
//                 /*
//                 <div 
//                     class="element large hasthumb" 
//                     title="Dall-E generated image 2022-11-08 18:17:29" 
//                     data-kind="image" 
//                     data-image-width="2200" 
//                     data-image-height="1467" 
//                     data-peer-file="" 
//                     data-movable="" 
//                     data-replaceable="" 
//                     data-type="craft\elements\Asset" 
//                     data-id="115322" 
//                     data-site-id="1" 
//                     data-status="enabled" 
//                     data-label="Dall-E generated image 2022-11-08 18:17:29" 
//                     data-url="https://optimise2.assets-servd.host/relieved-tarantula/production/dalle-generated-2022-11-08-18-17-29.png?w=2200&amp;h=1467&amp;auto=compress%2Cformat&amp;fit=crop&amp;dm=1667931449&amp;s=fb6ddee0a5928e1514fd9f9ca986f012" 
//                     data-settings="{&quot;context&quot;:&quot;modal&quot;,&quot;size&quot;:&quot;large&quot;,&quot;showStatus&quot;:false,&quot;showThumb&quot;:true,&quot;showLabel&quot;:true,&quot;showDraftName&quot;:true}" 
//                     data-editable=""
//                     ><div class="elementthumb checkered" data-sizes="120px" data-srcset="https://optimise2.assets-servd.host/relieved-tarantula/production/dalle-generated-2022-11-08-18-17-29.png?w=120&amp;h=80&amp;auto=compress%2Cformat&amp;fit=crop&amp;dm=1667931449&amp;s=2154db6077236272e0c0682a3d26a24b 120w, https://optimise2.assets-servd.host/relieved-tarantula/production/dalle-generated-2022-11-08-18-17-29.png?w=240&amp;h=160&amp;auto=compress%2Cformat&amp;fit=crop&amp;dm=1667931449&amp;s=498db3d714969a6c776b7d58f3b01371 240w"><img sizes="120px" srcset="https://optimise2.assets-servd.host/relieved-tarantula/production/dalle-generated-2022-11-08-18-17-29.png?w=120&amp;h=80&amp;auto=compress%2Cformat&amp;fit=crop&amp;dm=1667931449&amp;s=2154db6077236272e0c0682a3d26a24b 120w, https://optimise2.assets-servd.host/relieved-tarantula/production/dalle-generated-2022-11-08-18-17-29.png?w=240&amp;h=160&amp;auto=compress%2Cformat&amp;fit=crop&amp;dm=1667931449&amp;s=498db3d714969a6c776b7d58f3b01371 240w" alt=""></div><div class="label"><span class="title">Dall-E generated image 2022-11-08 18:17:29</span></div></div>
//                 */

//                 // How to find a reference to the field's JS object?

//                 let elementId = data.assetId;
//                 let title = data.title;
//                 let siteId = data.siteId;
//                 let imageUrl = data.imageUrl;

//                 let elementString = `<div 
//                     class="element large hasthumb" 
//                     data-kind="image" 
//                     data-image-width="2200" 
//                     data-image-height="1467" 
//                     data-peer-file="" 
//                     data-movable="" 
//                     data-replaceable="" 
//                     data-type="craft\elements\Asset" 
//                     data-site-id="1" 
//                     data-status="enabled" 
//                     data-settings="{&quot;context&quot;:&quot;modal&quot;,&quot;size&quot;:&quot;large&quot;,&quot;showStatus&quot;:false,&quot;showThumb&quot;:true,&quot;showLabel&quot;:true,&quot;showDraftName&quot;:true}" 
//                     data-editable=""
//                 >
//                     <div class="elementthumb checkered" data-sizes="120px" data-srcset="${imageUrl} 120w">
//                         <img sizes="120px" srcset="${imageUrl} 120w" alt="">
//                     </div>
//                     <div class="label"><span class="title">${title}</span></div>
//                 </div>`;

//                 let element = $(elementString);
//                 element.data('id', elementId);
//                 element.data('url', imageUrl);
//                 element.data('site-id', siteId);
//                 element.data('label', title);
//                 element.attr('title', title);

//                 let elements = [
//                     {
//                         id: elementId,
//                         $element: element
//                     }
//                 ]
//                 window.dalle[fieldId].selectElements(elements)

//             });
//         })

//         let variantsButton = document.createElement('button');
//         variantsButton.setAttribute('type', 'button');
//         variantsButton.classList.add('btn');
//         //variantsButton.classList.add('');
//         variantsButton.innerHTML = 'Generate variants';

//         let variantsData = {
//             imageUrl,
//             count: 4
//         }
//         variantsButton.addEventListener('click', function(e){
//             let useUrl = Craft.actionUrl + 'craft-dalle/dall-e-field/generate-variants&' + new URLSearchParams(variantsData);
//             fetch(useUrl, {
//                 method: 'GET',
//                 mode: 'same-origin',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 redirect: 'follow',    
//             }).then((response) => response.json()).then((data) => {
//                 populateResults(generator, data.urls);
//             });
//         });

//         let extendButton = document.createElement('button');
//         extendButton.setAttribute('type', 'button');
//         extendButton.classList.add('btn');
//         //extendButton.classList.add('');
//         extendButton.innerHTML = 'Extend horizontally';

//         extendButton.addEventListener('click', function(e){
//             let extendData = {
//                 imageUrl,
//                 prompt: promptInput.value,
//                 fieldId: fieldId,
//                 count: 4
//             }
//             let useUrl = Craft.actionUrl + 'craft-dalle/dall-e-field/extend-horizontally&' + new URLSearchParams(extendData);
//             fetch(useUrl, {
//                 method: 'GET',
//                 mode: 'same-origin',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 redirect: 'follow',    
//             }).then((response) => response.json()).then((data) => {
//                 populateExtensions(generator, data.left, data.right);
//             });
//         });


//         buttonHolder.appendChild(useButton);
//         buttonHolder.appendChild(variantsButton);
//         buttonHolder.appendChild(extendButton);
//         wrapper.appendChild(img);
//         wrapper.appendChild(buttonHolder);

//         //resultsContainer.append($(wrapper));
//     $div.append(wrapper);

//     }

    
//     var myModal = new Garnish.Modal($div);
// }

// function populateExtensions(generator, leftUrls, rightUrls)
// {
//     let promptInput = generator.getElementsByClassName('dalle-prompt')[0];
//     let fieldId = generator.getAttribute('data-fieldid');
//     let resultsPane = generator.getElementsByClassName('dalle-results-pane')[0];
//     let resultsContainer = resultsPane.getElementsByClassName('dalle-results')[0];
//     let extensionsPane = generator.getElementsByClassName('dalle-extensions-pane')[0];
//     let extensionsContainer = extensionsPane.getElementsByClassName('dalle-extensions-results')[0];
//     extensionsContainer.innerHTML = '';

//     let wrapper = document.createElement('div');
//     wrapper.classList.add('dalle-extensions-wrapper');

//     for (let i = 0; i<leftUrls.length; i++) {
//         let leftUrl = leftUrls[i];
//         let rightUrl = rightUrls[i];
        
//         let extensionsRow = document.createElement('div');
//         extensionsRow.classList.add('dalle-extensions-row');

//         let leftImage = document.createElement('img');
//         leftImage.setAttribute('src', leftUrl);

//         let rightImage = document.createElement('img');
//         rightImage.setAttribute('src', rightUrl);

//         extensionsRow.appendChild(leftImage);
//         extensionsRow.appendChild(rightImage);

//         wrapper.appendChild(extensionsRow);
//     }

//     extensionsContainer.appendChild(wrapper);

// }

function showModal(){
    editModal.show();
}

function hideModal(){
    editModal.hide();
}

function resetModal() {
    clearModal();
}

function clearModal() {
    $editModalResultsWrapper.empty();
    $editModalExtensionsWrapper.empty();
}

function clearExtensions() {
    $editModalExtensionsWrapper.empty();
}

function triggerModal(generator) {
    activeGenerator = generator;
    resetModal();
    showModal();
}

function performNewGeneration(prompt) {
    clearModal();
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
    }).then((response) => response.json()).then((data) => {
        
        //triggerModal(generator, data.urls);
        populateResults(data.urls);
    });
}

function populateResults(urls) {

    clearModal();
    for (imageUrl of urls) {
        let $item = $(`
        <div class="dalle-preview-item">
            <div class="dalle-preview-item-inner">
                <img src="${imageUrl}">
                <div class="dalle-preview-item-buttons">
                    <button type="button" class="btn dalle-use-button">Use this</button>
                    <button type="button" class="btn dalle-vary-button">Generate variations</button>
                    <button type="button" class="btn dalle-extend-button">Extend horizontally</button>
                </div>
            </div>
        </div>
        `);
        
        let fieldId = activeGenerator.getAttribute('data-fieldid');
        $editModalResultsWrapper.append($item);

        $item.find('.dalle-use-button').click(function(e){

            let useData = {
                imageUrl,
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
            }).then((response) => response.json()).then((data) => {

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
            });
        });


        $item.find('.dalle-vary-button').click(function(e){

            let varyData = {
                imageUrl,
                count: 4
            }

            let varyUrl = Craft.actionUrl + 'craft-dalle/dall-e-field/generate-variants&' + new URLSearchParams(varyData);
            fetch(varyUrl, {
                method: 'GET',
                mode: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',    
            }).then((response) => response.json()).then((data) => {
                populateResults(data.urls);
            });
        });

        $item.find('.dalle-extend-button').click(function(e){

            let extendData = {
                imageUrl,
                prompt: $editModalPromptInput.val(),
                fieldId: fieldId,
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
            }).then((response) => response.json()).then((data) => {
                populateExtensions(data.left, data.right);
            });
        });
    }
}

function populateExtensions(leftUrls, rightUrls) {
    clearExtensions()
    for (let i = 0; i<leftUrls.length; i++) {
        let leftUrl = leftUrls[i];
        let rightUrl = rightUrls[i];
        $row = $(`
        <div class="dalle-extensions-row">
            <img src="${leftUrl}">
            <img src="${rightUrl}">
        </div>
        `);
        $editModalExtensionsWrapper.append($row);
    }
}