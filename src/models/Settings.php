<?php

namespace servd\DallEFieldtype\models;

use Craft;
use craft\base\Model;

class Settings extends Model
{
    public $apiKey = '';

    public function rules(): array
    {
        $rules = [];
        return $rules;
    }
}
