<?php

namespace servd\DallEFieldtype\controllers;

use Craft;
use craft\web\Controller;
use craft\web\Request;
use GuzzleHttp\Exception\ClientException;
use servd\DallEFieldtype\Plugin;
use servd\DallEFieldtype\services\DallE;

class DallEFieldController extends Controller
{
    protected array|bool|int $allowAnonymous = false;

    public function actionGenerateImages()
    {
        $this->requireCpRequest();
        $settings = Plugin::$plugin->getSettings();
        if (empty($settings->getApiKey())) {
            return $this->asJson([
                'result' => 'error',
                'message' => "No Open AI API key has been set in the plugin settings.",
            ])->setStatusCode(400);
        }

        /** @var Request $req */
        $req = Craft::$app->getRequest();
        $prompt = $req->getQueryParam('prompt');
        $fieldId = $req->getQueryParam('fieldId');
        $count = intval($settings->count);

        /** @var DallE $dalle */
        $dalle = Plugin::$plugin->dalle;
        try {
            $urls = $dalle->generateImages($prompt, $fieldId, $count);
        } catch(ClientException $e) {

            $response = json_decode($e->getResponse()->getBody());
            if (empty($response)) {
                return $this->asJson([
                    'result' => 'error',
                    'message' => "There was an error communicating with the Open AI API.",
                ])->setStatusCode(500);
            }
            
            return $this->asJson([
                'result' => 'error',
                'message' => $response->error->message ?? "There was an error communicating with the Open AI API.",
            ])->setStatusCode(500);

        } catch(\Exception $e) {
            return $this->asJson([
                'result' => 'error',
                'message' => $e->getMessage(),
            ])->setStatusCode(500);
        }

        return $this->asJson([
            'result' => 'success',
            'urls' => $urls,
        ]);
    }

    public function actionGenerateVariants()
    {
        $this->requireCpRequest();
        $settings = Plugin::$plugin->getSettings();
        if (empty($settings->getApiKey())) {
            return $this->asJson([
                'result' => 'error',
                'message' => "No Open AI API key has been set in the plugin settings.",
            ])->setStatusCode(400);
        }

        /** @var Request $req */
        $req = Craft::$app->getRequest();
        $imageUrl = $req->getQueryParam('imageUrl');
        $count = intval($settings->count);

        /** @var DallE $dalle */
        $dalle = Plugin::$plugin->dalle;
        try {
            $urls = $dalle->generateVariants($imageUrl, $count);
        } catch(ClientException $e) {

            $response = json_decode($e->getResponse()->getBody());
            if (empty($response)) {
                return $this->asJson([
                    'result' => 'error',
                    'message' => "There was an error communicating with the Open AI API.",
                ])->setStatusCode(500);
            }
            
            return $this->asJson([
                'result' => 'error',
                'message' => $response->error->message ?? "There was an error communicating with the Open AI API.",
            ])->setStatusCode(500);

        } catch(\Exception $e) {
            return $this->asJson([
                'result' => 'error',
                'message' => $e->getMessage(),
            ])->setStatusCode(500);
        }

        return $this->asJson([
            'result' => 'success',
            'urls' => $urls,
        ]);
    }

    public function actionExtendHorizontally()
    {
        $this->requireCpRequest();
        $settings = Plugin::$plugin->getSettings();
        if (empty($settings->getApiKey())) {
            return $this->asJson([
                'result' => 'error',
                'message' => "No Open AI API key has been set in the plugin settings.",
            ])->setStatusCode(400);
        }

        /** @var Request $req */
        $req = Craft::$app->getRequest();
        $imageUrl = $req->getQueryParam('imageUrl');
        $prompt = $req->getQueryParam('prompt');
        $fieldId = $req->getQueryParam('fieldId');
        $count = intval($settings->count);

        /** @var DallE $dalle */
        $dalle = Plugin::$plugin->dalle;
        try {
            $urls = $dalle->extendHorizontally($imageUrl, $prompt, $fieldId, $count);
        } catch(ClientException $e) {

            $response = json_decode($e->getResponse()->getBody());
            if (empty($response)) {
                return $this->asJson([
                    'result' => 'error',
                    'message' => "There was an error communicating with the Open AI API.",
                ])->setStatusCode(500);
            }
            
            return $this->asJson([
                'result' => 'error',
                'message' => $response->error->message ?? "There was an error communicating with the Open AI API.",
            ])->setStatusCode(500);

        } catch(\Exception $e) {
            return $this->asJson([
                'result' => 'error',
                'message' => $e->getMessage(),
            ])->setStatusCode(500);
        }

        return $this->asJson([
            'result' => 'success',
            'left' => $urls['left'],
            'right' => $urls['right'],
        ]);
    }

    public function actionUseImage()
    {
        $this->requireCpRequest();
        /** @var Request $req */
        $req = Craft::$app->getRequest();

        $url = $req->getQueryParam('imageUrl');
        $fieldId = $req->getQueryParam('fieldId');

        $fields = Craft::$app->getFields();
        $field = $fields->getFieldById($fieldId);

        $folderId = $field->resolveDynamicPathToFolderId(null);

        $assetsService = Craft::$app->getAssets();
        $folder = $assetsService->getFolderById($folderId);

        // Convert the url into an asset
        /** @var DallE $dalle */
        $dalle = Plugin::$plugin->dalle;
        try{
            $asset = $dalle->saveImageAsAsset($url, $folder);
        } catch(\Exception $e) {
            return $this->asJson([
                'result' => 'error',
                'message' => $e->getMessage(),
            ])->setStatusCode(500);
        }

        return $this->asJson([
            'result' => 'success',
            'assetId' => $asset->id,
            'title' => $asset->title,
            'siteId' => '1',
            'imageUrl' => $asset->getUrl()
        ]);

    }

    public function actionUseImagePair()
    {
        $this->requireCpRequest();
        /** @var Request $req */
        $req = Craft::$app->getRequest();

        $leftUrl = $req->getQueryParam('leftImageUrl');
        $rightUrl = $req->getQueryParam('rightImageUrl');
        $fieldId = $req->getQueryParam('fieldId');

        $fields = Craft::$app->getFields();
        $field = $fields->getFieldById($fieldId);

        $folderId = $field->resolveDynamicPathToFolderId(null);

        $assetsService = Craft::$app->getAssets();
        $folder = $assetsService->getFolderById($folderId);

        // Convert the url into an asset
        /** @var DallE $dalle */
        $dalle = Plugin::$plugin->dalle;
        try{
            $asset = $dalle->saveImagePairAsAsset($leftUrl, $rightUrl, $folder);    
        } catch(\Exception $e) {
            return $this->asJson([
                'result' => 'error',
                'message' => $e->getMessage(),
            ])->setStatusCode(500);
        }

        return $this->asJson([
            'result' => 'success',
            'assetId' => $asset->id,
            'title' => $asset->title,
            'siteId' => '1',
            'imageUrl' => $asset->getUrl()
        ]);

    }
}
