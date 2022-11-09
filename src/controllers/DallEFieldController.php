<?php

namespace servd\DallEFieldtype\controllers;

use Craft;
use craft\web\Controller;
use craft\web\Request;
use servd\DallEFieldtype\Plugin;
use servd\DallEFieldtype\services\DallE;

class DallEFieldController extends Controller
{
    protected array|bool|int $allowAnonymous = false;

    public function actionGenerateImages()
    {
        $this->requireCpRequest();
        /** @var Request $req */
        $req = Craft::$app->getRequest();

        $prompt = $req->getQueryParam('prompt');
        $fieldId = $req->getQueryParam('fieldId');
        $count = $req->getQueryParam('count', '1');
        $count = intval($count);

        /** @var DallE $dalle */
        $dalle = Plugin::$plugin->dalle;
        $urls = $dalle->generateImages($prompt, $fieldId, $count);

        return $this->asJson([
            'result' => 'success',
            'urls' => $urls,
        ]);
    }

    public function actionGenerateVariants()
    {
        $this->requireCpRequest();
        /** @var Request $req */
        $req = Craft::$app->getRequest();

        $imageUrl = $req->getQueryParam('imageUrl');
        $count = $req->getQueryParam('count', '1');
        $count = intval($count);

        /** @var DallE $dalle */
        $dalle = Plugin::$plugin->dalle;
        $urls = $dalle->generateVariants($imageUrl, $count);

        return $this->asJson([
            'result' => 'success',
            'urls' => $urls,
        ]);
    }

    public function actionExtendHorizontally()
    {
        $this->requireCpRequest();
        /** @var Request $req */
        $req = Craft::$app->getRequest();

        $imageUrl = $req->getQueryParam('imageUrl');
        $prompt = $req->getQueryParam('prompt');
        $fieldId = $req->getQueryParam('fieldId');
        $count = $req->getQueryParam('count', '1');
        $count = intval($count);

        /** @var DallE $dalle */
        $dalle = Plugin::$plugin->dalle;
        $urls = $dalle->extendHorizontally($imageUrl, $prompt, $fieldId, $count);

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
        $asset = $dalle->saveImageAsAsset($url, $folder);

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
        $asset = $dalle->saveImagePairAsAsset($leftUrl, $rightUrl, $folder);

        return $this->asJson([
            'result' => 'success',
            'assetId' => $asset->id,
            'title' => $asset->title,
            'siteId' => '1',
            'imageUrl' => $asset->getUrl()
        ]);

    }
}
