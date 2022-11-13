<?php

namespace servd\DallEFieldtype\services;

use Craft;
use craft\base\Component;
use craft\elements\Asset;
use craft\helpers\Path;
use craft\services\Fields;
use craft\services\Path as ServicesPath;
use Imagick;
use ImagickPixel;
use servd\DallEFieldtype\Plugin;

class DallE extends Component
{

    public function generateImages($prompt, $fieldId = null, $count = 1)
    {

        if (getenv('DALLE_DEBUG') ?? false) {
            return [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/1024px-IMDb_Logo_Square.svg.png',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/1024px-IMDb_Logo_Square.svg.png',
            ];
        }

        $settings = Plugin::$plugin->getSettings();

        $fullPrompt = $prompt;
        if (!empty($fieldId)) {
            // Find the field and grab the pretext and posttext from it
            /** @var Fields $fields */
            $fields = Craft::$app->getFields();
            $field = $fields->getFieldById($fieldId);
            $fullPrompt = $field->preText . ' ' . $prompt . ' ' . $field->postText;
        }

        $guzzle = Craft::createGuzzleClient();
        $r = $guzzle->post('https://api.openai.com/v1/images/generations', [
            'headers' => [
                'Authorization' => 'Bearer ' . $settings->getApiKey()
            ],
            'json' => [
                "prompt" => $fullPrompt,
                "n" => $count,
                "size" => "1024x1024",
                "response_format" => 'url',
            ]
        ]);

        $result = json_decode($r->getBody());
        $urls = [];
        foreach ($result->data as $item) {
            $urls[] = $item->url;
        }

        return $urls;
    }

    public function generateVariants($sampleUrl, $count = 1)
    {

        if (getenv('DALLE_DEBUG') ?? false) {
            return [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/1024px-IMDb_Logo_Square.svg.png',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/1024px-IMDb_Logo_Square.svg.png',
            ];
        }

        $settings = Plugin::$plugin->getSettings();

        // Download the asset
        /** @var ServicesPath $pathService */
        $pathService = Craft::$app->getPath();
        $tempPath = $pathService->getTempPath(true) . '/' . mt_rand(0, 9999999) . '.png';
        file_put_contents($tempPath, file_get_contents($sampleUrl));

        $body = fopen($tempPath, 'r');

        $guzzle = Craft::createGuzzleClient();
        $r = $guzzle->post('https://api.openai.com/v1/images/variations', [
            'headers' => [
                'Authorization' => 'Bearer ' . $settings->getApiKey()
            ],
            'multipart' => [
                ["name" => "image", "contents" => $body],
                ["name" => "n", "contents" => $count],
                ["name" => "size", "contents" => "1024x1024"],
                ["name" => "response_format", "contents" => 'url'],
            ]
        ]);

        $result = json_decode($r->getBody());
        $urls = [];
        foreach ($result->data as $item) {
            $urls[] = $item->url;
        }

        return $urls;
    }

    public function extendHorizontally($sampleUrl, $prompt, $fieldId = null, $count = 1)
    {

        if (getenv('DALLE_DEBUG') ?? false) {
            return [
                'left' => [
                    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/1024px-IMDb_Logo_Square.svg.png',
                    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/1024px-IMDb_Logo_Square.svg.png',
                ],
                'right' => [
                    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/1024px-IMDb_Logo_Square.svg.png',
                    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/1024px-IMDb_Logo_Square.svg.png',
                ],
            ];
        }

        $settings = Plugin::$plugin->getSettings();

        $fullPrompt = $prompt;
        if (!empty($fieldId)) {
            // Find the field and grab the pretext and posttext from it
            /** @var Fields $fields */
            $fields = Craft::$app->getFields();
            $field = $fields->getFieldById($fieldId);
            $fullPrompt = $field->preText . ' ' . $prompt . ' ' . $field->postText;
        }

        // Download the asset
        /** @var ServicesPath $pathService */
        $pathService = Craft::$app->getPath();
        $tempPath = $pathService->getTempPath(true) . '/' . mt_rand(0, 9999999) . '.png';
        file_put_contents($tempPath, file_get_contents($sampleUrl));

        $originalImage = new Imagick($tempPath);

        $guzzle = Craft::createGuzzleClient();

        $leftMaskPath = Craft::getAlias('@servd/DallEFieldtype') . '/assets/leftMask.png';
        $rightMaskPath = Craft::getAlias('@servd/DallEFieldtype') . '/assets/rightMask.png';
        
        //Left side
        $leftCanvas = new Imagick();
        $leftCanvas->newImage(1024, 1024, 'white', 'png' );
        $leftCanvas->compositeImage($originalImage, imagick::COMPOSITE_OVER, 1024/2, 0 );
        $leftCanvasPath = $pathService->getTempPath(true) . '/' . mt_rand(0, 9999999) . '.png';
        $leftCanvas->writeImage($leftCanvasPath);
        $leftCanvas->clear();

        //Right side
        $rightCanvas = new Imagick();
        $rightCanvas->newImage(1024, 1024, 'white', 'png' );
        $rightCanvas->compositeImage($originalImage, imagick::COMPOSITE_OVER, -(1024/2), 0 );
        $rightCanvasPath = $pathService->getTempPath(true) . '/' . mt_rand(0, 9999999) . '.png';
        $rightCanvas->writeImage($rightCanvasPath);
        
        $rightCanvas->clear();

        $leftUrls = $guzzle->post('https://api.openai.com/v1/images/edits', [
            'headers' => [
                'Authorization' => 'Bearer ' . $settings->getApiKey()
            ],
            'multipart' => [
                ["name" => "image", "contents" => fopen($leftCanvasPath, 'r')],
                ["name" => "mask", "contents" => fopen($leftMaskPath, 'r')],
                ["name" => "prompt", "contents" => $fullPrompt],
                ["name" => "n", "contents" => $count],
                ["name" => "size", "contents" => "1024x1024"],
                ["name" => "response_format", "contents" => 'url'],
            ]
        ]);

        $rightUrls = $guzzle->post('https://api.openai.com/v1/images/edits', [
            'headers' => [
                'Authorization' => 'Bearer ' . $settings->getApiKey()
            ],
            'multipart' => [
                ["name" => "image", "contents" => fopen($rightCanvasPath, 'r')],
                ["name" => "mask", "contents" => fopen($rightMaskPath, 'r')],
                ["name" => "prompt", "contents" => $fullPrompt],
                ["name" => "n", "contents" => $count],
                ["name" => "size", "contents" => "1024x1024"],
                ["name" => "response_format", "contents" => 'url'],
            ]
        ]);

        $leftResult = json_decode($leftUrls->getBody());
        $rightResult = json_decode($rightUrls->getBody());
        
        return [
            'left' => array_map(function($e){
                return $e->url;
            }, $leftResult->data),
            'right' => array_map(function($e){
                return $e->url;
            }, $rightResult->data),
        ];
    }

    public function repaintSection($imageUrl, $maskB64, $prompt, $fieldId, $count)
    {

        if (getenv('DALLE_DEBUG') ?? false) {
            return [
                'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/1024px-IMDb_Logo_Square.svg.png',
                'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/IMDb_Logo_Square.svg/1024px-IMDb_Logo_Square.svg.png',
            ];
        }

        $settings = Plugin::$plugin->getSettings();

        $fullPrompt = $prompt;
        if (!empty($fieldId)) {
            // Find the field and grab the pretext and posttext from it
            /** @var Fields $fields */
            $fields = Craft::$app->getFields();
            $field = $fields->getFieldById($fieldId);
            $fullPrompt = $field->preText . ' ' . $prompt . ' ' . $field->postText;
        }

        // Download the image
        /** @var ServicesPath $pathService */
        $pathService = Craft::$app->getPath();
        $tempPath = $pathService->getTempPath(true) . '/' . mt_rand(0, 9999999) . '.png';
        file_put_contents($tempPath, file_get_contents($imageUrl));
        

        // Save the mask
        $maskBlob = base64_decode($maskB64);
        $mask = new Imagick();
        $mask->readImageBlob($maskBlob);
        $mask->negateImage(false, Imagick::CHANNEL_ALPHA);
        $mask->scaleImage(1024, 1024);
        $maskPath = $pathService->getTempPath(true) . '/' . mt_rand(0, 9999999) . '.png';
        $mask->writeImage('png32:' . $maskPath);

        $guzzle = Craft::createGuzzleClient();
        $r = $guzzle->post('https://api.openai.com/v1/images/edits', [
            'headers' => [
                'Authorization' => 'Bearer ' . $settings->getApiKey()
            ],
            'multipart' => [
                ["name" => "image", "contents" => fopen($tempPath, 'r')],
                ["name" => "mask", "contents" => fopen($maskPath, 'r')],
                ["name" => "prompt", "contents" => $fullPrompt],
                ["name" => "n", "contents" => $count],
                ["name" => "size", "contents" => "1024x1024"],
                ["name" => "response_format", "contents" => 'url'],
            ]
        ]);

        $result = json_decode($r->getBody());
        $urls = [];
        foreach ($result->data as $item) {
            $urls[] = $item->url;
        }

        return $urls;

    }

    public function saveImageAsAsset($url, $folder)
    {

        // Download the asset
        /** @var ServicesPath $pathService */
        $pathService = Craft::$app->getPath();
        $tempPath = $pathService->getTempPath(true) . '/' . mt_rand(0, 9999999) . '.png';
        file_put_contents($tempPath, file_get_contents($url));

        $datetimefile = date('Y-m-d-H-i-s');
        $datetime = date('Y-m-d H:i:s');
        $filename = 'dalle-generated-' . $datetimefile . '.png';
        $assetTitle = 'Dall-E generated image ' . $datetime;

        $asset = new Asset();
        $asset->tempFilePath = $tempPath;
        $asset->filename = $filename;
        $asset->folderId = $folder->id;
        $asset->newFolderId = $folder->id;
        $asset->kind = "Image";
        $asset->title = $assetTitle;
        $asset->avoidFilenameConflicts = true;
        $asset->setVolumeId($folder->volumeId);
        $asset->setScenario(Asset::SCENARIO_CREATE);

        $asset->validate();
        Craft::$app->getElements()->saveElement($asset, false);

        return $asset;
    }

    public function saveImagePairAsAsset($leftUrl, $rightUrl, $folder)
    {

        // Download the asset
        /** @var ServicesPath $pathService */
        $pathService = Craft::$app->getPath();
        $leftTempPath = $pathService->getTempPath(true) . '/' . mt_rand(0, 9999999) . '.png';
        file_put_contents($leftTempPath, file_get_contents($leftUrl));
        $leftImage = new Imagick($leftTempPath);

        $rightTempPath = $pathService->getTempPath(true) . '/' . mt_rand(0, 9999999) . '.png';
        file_put_contents($rightTempPath, file_get_contents($rightUrl));
        $rightImage = new Imagick($rightTempPath);

        $canvas = new Imagick();
        $canvas->newImage(1024*2, 1024, 'white', 'jpg' );
        $canvas->compositeImage($leftImage, imagick::COMPOSITE_OVER, 0, 0 );
        $canvas->compositeImage($rightImage, imagick::COMPOSITE_OVER, 1024, 0 );
        $canvasPath = $pathService->getTempPath(true) . '/' . mt_rand(0, 9999999) . '.jpg';
        $canvas->writeImage($canvasPath);
        $canvas->clear();

        $datetimefile = date('Y-m-d-H-i-s');
        $datetime = date('Y-m-d H:i:s');
        $filename = 'dalle-generated-' . $datetimefile . '.jpg';
        $assetTitle = 'Dall-E generated image ' . $datetime;

        $asset = new Asset();
        $asset->tempFilePath = $canvasPath;
        $asset->filename = $filename;
        $asset->folderId = $folder->id;
        $asset->newFolderId = $folder->id;
        $asset->kind = "Image";
        $asset->title = $assetTitle;
        $asset->avoidFilenameConflicts = true;
        $asset->setVolumeId($folder->volumeId);
        $asset->setScenario(Asset::SCENARIO_CREATE);

        $asset->validate();
        Craft::$app->getElements()->saveElement($asset, false);

        return $asset;
    }

}
