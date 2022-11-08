<?php

namespace servd\DallEFieldtype\Fieldtypes;

use Craft;
use craft\fields\Assets;

class DallEField extends Assets
{

    protected string $inputTemplate = 'field/input.twig';

    public static function displayName(): string
    {
        return 'Assets with Dall-E';
    }

}