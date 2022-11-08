<?php

namespace servd\DallEFieldtype;

use Craft;
use craft\base\Model;
use craft\base\Plugin as BasePlugin;
use craft\events\RegisterComponentTypesEvent;
use craft\services\Fields;
use yii\base\Event;

class Plugin extends BasePlugin
{
    public string $schemaVersion = '1.0.0';
    public static $plugin;
    public bool $hasCpSettings = true;

    public function init():void
    {
        parent::init();
        self::$plugin = $this;
        $settings = $this->getSettings();

        // Set the controllerNamespace based on whether this is a console or web request
        if (Craft::$app->getRequest()->getIsConsoleRequest()) {
            $this->controllerNamespace = 'servd\\DallEFieldtype\\console\\controllers';
        } else {
            $this->controllerNamespace = 'servd\\DallEFieldtype\\controllers';
        }

        Event::on(
            Fields::class,
            Fields::EVENT_REGISTER_FIELD_TYPES,
            function(RegisterComponentTypesEvent $event) {
                $event->types[] = DallEField::class;
            }
        );


        // $this->registerVariables();
        // $this->registerComponentsAndServices();
        // $this->initialiseComponentsAndServices();
    }

    protected function createSettingsModel() : ?Model
    {
        return new \servd\DallEFieldtype\models\Settings();
    }

    protected function settingsHtml() : ?string
    {
        $settings = $this->getSettings();
        return \Craft::$app->getView()->renderTemplate('craft-dalle/settings', [
            'settings' => $settings,
        ]);
    }

    private function registerVariables()
    {
        
    }

    public function registerComponentsAndServices()
    {
        
    }

    public function initialiseComponentsAndServices()
    {
       
    }
}
