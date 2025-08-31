<?php
/*
Plugin Name: Cyb Marzipano Viewer
Plugin URI: https://github.com/Cyb10101/wordpress_cyb-marzipano-viewer
Description: Adds a Marzipano Viewer
Author: Cyb10101
Version: 1.0.0
Author URI: https://cyb10101.de/
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
*/

if (!defined('ABSPATH')) {
    exit(); // Exit if accessed directly
}

class CybMarzipanoViewer {
    public function initialize() {
        add_action('init', [$this, 'wpInit']);
        add_action('enqueue_block_editor_assets', [$this, 'wpEnqueueBlockEditorAssets']);
    }

    /**
     * Wordpress initialize
     */
    public function wpInit() {
        $versionMarzipano='0.10.2'; // https://www.marzipano.net/
        wp_register_script('marzipano', plugins_url('vendor/marzipano.js', __FILE__), [], $versionMarzipano,
            [
                'in_footer' => true,
                'strategy'  => 'async',
            ]
        );
        wp_register_script('marzipano-DeviceOrientation', plugins_url('vendor/DeviceOrientationControlMethod.js', __FILE__),
            ['marzipano'], $versionMarzipano,
            [
                'in_footer' => true,
                'strategy'  => 'async',
            ]
        );

        wp_register_style('cyb-marzipano-viewer', plugins_url('marzipano-viewer.css', __FILE__), [],
            filemtime(plugin_dir_path(__FILE__) . 'marzipano-viewer.css')
        );
        wp_register_script('cyb-marzipano-viewer', plugins_url('marzipano-viewer.js', __FILE__), ['marzipano', 'marzipano-DeviceOrientation'],
            filemtime(plugin_dir_path(__FILE__) . 'marzipano-viewer.js'),
            [
                'in_footer' => true,
                'strategy'  => 'async',
            ]
        );
        wp_localize_script('cyb-marzipano-viewer', 'cybLocalize', [
            'pluginsUrl' => plugins_url('', __FILE__),
        ]);

        wp_register_script('cyb-marzipano-block', plugins_url('block.js', __FILE__),
            ['wp-blocks', 'wp-element', 'wp-components'],
            filemtime(plugin_dir_path(__FILE__) . 'block.js'),
            [
                'in_footer' => true,
                'strategy'  => 'async',
            ]
        );

        register_block_type('cyb/marzipano-viewer', [
            'editor_script' => 'cyb-marzipano-block',
            'render_callback' => [$this, 'renderBlock'],
            'attributes' => [
                'uid' => ['type' => 'string', 'default' => ''],
                'src' => ['type' => 'string', 'default' => ''],
                // Preview not needed

                'basePath' => ['type' => 'string', 'default' => ''],
                'settings' => ['type' => 'object', 'default' => [
                    'mouseViewMode' => 'drag',
                    'autorotateEnabled' => true,
                    'fullscreenButton' => true,
                    'viewControlButtons' => false
                ]],
            ],
        ]);
    }

    /**
     * Wordpress enqueue block editor assets
     */
    public function wpEnqueueBlockEditorAssets() {
        $this->enqueueAssets();
    }

    protected function enqueueAssets() {
        wp_enqueue_script('marzipano');
        wp_enqueue_script('marzipano-DeviceOrientation');

        wp_enqueue_style('cyb-marzipano-viewer');
        wp_enqueue_script('cyb-marzipano-viewer');
    }

    /**
     * Render block for frontend
     */
    public function renderBlock(array $attributes, string $content, \WP_Block $block): string {
        $id = 'cyb-marzipano-viewer_' . (!empty($attributes['uid']) ? $attributes['uid'] : '');
        $src = (!empty($attributes['src']) ? $attributes['src'] : '');

        $override = [
            'basePath' => $attributes['basePath'],
            'settings' => $attributes['settings'],
        ];

        $this->enqueueAssets();
        return '<div id="' . esc_attr($id) . '" class="cyb-marzipano-viewer"'
            . ' data-src="' . esc_attr($src) . '"'
            . ' data-override=\'' . esc_attr(wp_json_encode($override)) . '\'></div>';
    }
}

$cybMarzipanoViewer = new CybMarzipanoViewer();
$cybMarzipanoViewer->initialize();
