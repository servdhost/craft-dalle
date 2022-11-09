<?php

namespace servd\DallEFieldtype\assetbundles;

use craft\web\AssetBundle;
use craft\web\assets\cp\CpAsset;
use craft\web\assets\vue\VueAsset;

class DallEFieldtypeBundle extends AssetBundle
{
    public function init()
    {
        $this->sourcePath = '@servd/DallEFieldtype/web/assets';

        $this->depends = [
            CpAsset::class,
            VueAsset::class,
        ];

        $this->js = [
            'dallefieldtype.js',
        ];

        $this->css = [
            'dallefieldtype.css',
        ];

        parent::init();
    }
}