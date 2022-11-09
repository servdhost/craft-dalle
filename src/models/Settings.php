<?php

namespace servd\DallEFieldtype\models;

use Craft;
use craft\base\Model;

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
}
