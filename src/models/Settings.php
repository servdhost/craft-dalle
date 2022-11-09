<?php

namespace servd\DallEFieldtype\models;

use Craft;
use craft\base\Model;
use craft\helpers\App;

class Settings extends Model
{
    public $apiKey = '';
    public $count = 4;

    public function rules(): array
    {
        $rules = [
            ['count', 'required'], 
            ['count', 'integer', 'min' => 1, 'max' => 8],
        ];
        return $rules;
    }

    public function getApiKey()
    {
        if (!empty($this->apiKey)) {
            return App::parseEnv($this->apiKey);
        }
        return '';
    }
}
