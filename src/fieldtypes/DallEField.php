<?php

namespace servd\DallEFieldtype\fieldtypes;

use Craft;
use craft\base\ElementInterface;
use craft\fields\Assets;

class DallEField extends Assets
{

    protected string $settingsTemplate = 'craft-dalle/field/settings.twig';
    protected string $inputTemplate = 'craft-dalle/field/input.twig';

    public $apiKey = '';
    public $preText = '';
    public $postText = '';

    public static function displayName(): string
    {
        return 'Assets with Dall-E';
    }

}