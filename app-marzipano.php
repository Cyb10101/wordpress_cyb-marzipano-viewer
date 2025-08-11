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

class CybMarzipano {
    public function initialize() {
        add_action('init', [$this, 'wpInit']);
    }

    public function wpInit() {
        // https://www.marzipano.net/
        $versionMarzipano='0.10.2';
        wp_enqueue_script('marzipano', plugins_url('vendor/marzipano.js', __FILE__), [], $versionMarzipano, true);
        wp_enqueue_script('marzipano-DeviceOrientation', plugins_url('vendor/DeviceOrientationControlMethod.js', __FILE__), ['marzipano'], $versionMarzipano, true);

        wp_enqueue_style('cyb-marzipano', plugins_url('marzipano.css', __FILE__), [],
            filemtime(plugin_dir_path(__FILE__) . 'marzipano.css')
        );
        wp_enqueue_script('cyb-marzipano', plugins_url('marzipano.js', __FILE__), ['marzipano', 'marzipano-DeviceOrientation'],
            filemtime(plugin_dir_path(__FILE__) . 'marzipano.js'), true
        );
        wp_localize_script('cyb-marzipano', 'cybLocalize', [
            'pluginsUrl' => plugins_url('', __FILE__),
        ]);

        wp_register_script('cyb-marzipano-block', plugins_url('block.js', __FILE__),
            ['wp-blocks', 'wp-element', 'wp-components', 'marzipano', 'marzipano-DeviceOrientation', 'cyb-marzipano'],
            filemtime(plugin_dir_path(__FILE__) . 'block.js'), true
        );

        register_block_type('cyb/marzipano-viewer', [
            'editor_script' => 'cyb-marzipano-block',
            'render_callback' => [$this, 'renderBlock'],
            'attributes' => [
                'uid' => ['type' => 'string', 'default' => ''],
                'json' => ['type' => 'string', 'default' => ''],
            ],
        ]);
    }

    public function renderBlock($attrs) {
        $id = 'cyb-marzipano_' . (!empty($attrs['uid']) ? $attrs['uid'] : uniqid());

        $json = !empty($attrs['json']) && $attrs['json'] ? $attrs['json'] : '{}';
        $config = json_decode($json, !true);
        if (json_last_error() > 0) {
            return '<div>Marzipano JSON malformed: ' . json_last_error_msg() . '</div>';
        }

        $attributes = $attrs;
        unset($attributes['json']);
        unset($attributes['preview']);

        ob_start();
        ?><div id="<?php echo esc_attr($id); ?>" class="cyb-marzipano"></div>
        <script>
        document.addEventListener("DOMContentLoaded", function() {
            try {
                (new CybMarzipano).renderViewer("<?php echo esc_js($id); ?>", {
                    ...<?php echo json_encode($config); ?>,
                    ...<?php echo json_encode($attributes); ?>,
                });
            } catch(e) {}
        });
        </script><?php
        return ob_get_clean();
    }
}

$cybMarzipano = new CybMarzipano();
$cybMarzipano->initialize();
