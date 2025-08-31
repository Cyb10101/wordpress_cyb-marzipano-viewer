(() => {
  const {createElement, useState, useRef} = wp.element;
  const {registerBlockType} = wp.blocks;
  const {TextControl, PanelBody, SelectControl, ToggleControl, ToolbarGroup, ToolbarButton, Button} = wp.components;
  const {BlockControls, InspectorControls} = wp.blockEditor;

  // Fetch configuration
  const fetchConfig = async (url) => {
    url = (url || '').trim();
    if (!url) {
      return null;
    }
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return data ?? null;
    } catch (exception) {
      console.error('Marzipano fetchConfig failed', exception);
      return null;
    }
  };

  const hashCode = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    //return h.toString(); // Integer
    return Math.abs(h).toString(36); // 0-9 + a-z
  }

  registerBlockType('cyb/marzipano-viewer', {
    title: 'Cyb Marzipano Viewer',
    icon: 'format-image',
    category: 'embed',

    attributes: {
      uid: {type: 'string', default: ''},
      src: {type: 'string', default: ''},
      preview: {type: 'boolean', default: false},

      basePath: {type: 'string', default: ''},
      settings: {type: 'object', default: {
        mouseViewMode: 'drag',
        autorotateEnabled: true,
        fullscreenButton: true,
        viewControlButtons: false
      }},
    },

    edit: (props) => {
      const {attributes, setAttributes, clientId} = props;
      const [error, setError] = useState('');
      const [draftUrl, setDraftUrl] = useState(attributes.src || '');
      const [debouncedAttributes, setDebouncedAttributes] = useState(attributes);
      const refTimer = useRef(0);
      setAttributes({uid: clientId});

      // Debounce attribute changes
      clearTimeout(refTimer.current);
      refTimer.current = setTimeout(() => setDebouncedAttributes(attributes), 500);

      const parseAttributesByConfig = (config) => {
        let newAttributes = {};
        if (config.basePath) {
          newAttributes.basePath = config.basePath && config.basePath !== '' ? config.basePath : '';
        }
        if (config.hasOwnProperty('settings')) {
          config.settings = {};
          if (config.settings.hasOwnProperty('mouseViewMode')) {
            newAttributes.settings.mouseViewMode = config.settings.settings.mouseViewMode === 'qtvr' ? 'qtvr' : 'drag'
          }
          if (config.settings.hasOwnProperty('autorotateEnabled')) {
            newAttributes.settings.autorotateEnabled = config.settings.autorotateEnabled === true;
          }
          if (config.settings.hasOwnProperty('fullscreenButton')) {
            newAttributes.settings.fullscreenButton = config.settings.fullscreenButton === true;
          }
          if (config.settings.hasOwnProperty('viewControlButtons')) {
            newAttributes.settings.viewControlButtons = config.settings.viewControlButtons === true;
          }
        }
        return newAttributes;
      }

      const marzipanoPreview = createElement('div', {
        key: hashCode(JSON.stringify(debouncedAttributes)), // Used for new rendering
        id: 'cyb-marzipano-viewer_' + debouncedAttributes.uid,
        className: 'cyb-marzipano-viewer',
        'data-src': debouncedAttributes.src,
        'data-override': JSON.stringify({
            basePath: debouncedAttributes.basePath,
            settings: debouncedAttributes.settings,
        }),
        style: {
          minHeight: '50px',
          background: '#f7f7f7',
        },
      });

      const errorBox = createElement(
          'div', {
            style: {
              display: 'flex', alignItems: 'center', gap: '0.2em',
              color: '#991b1b', backgroundColor: '#ffe6e6',
              marginBottom: '5px', padding: '4px', borderRadius: '4px'
            }
          },
          createElement('span', {class: 'dashicons dashicons-warning'}, ''),
          createElement('b', {}, ' Error: '), error
        );

      const editUrl = createElement(
        'div', {
          style: {
            display: 'flex', flexDirection: 'column',
            background: '#f7f7f7', border: '1px solid #ddd', borderRadius: '4px', padding: '5px',
          }
        },
        createElement('h4', {style: {margin: '0 0 0.8em'}}, 'Enter a config.json URL below and click Embed.'),
        createElement(
          TextControl, {
            label: 'Config JSON URL',
            hideLabelFromVision: true,
            placeholder: '/panorama/marzipano/project/config.json',
            value: draftUrl,
            onChange: (val) => {
              setError('');
              setDraftUrl(val);
            },
            style: {flex: '1 0 auto'}
          }
        ),
        error !== '' ? errorBox : null,
        createElement(
          Button, {
            variant: 'primary',
            onClick: async () => {
              const config = await fetchConfig(draftUrl);
              if (config) {
                let newAttributes = parseAttributesByConfig(config);
                newAttributes = {
                  ...newAttributes,
                  src: draftUrl,
                  preview: true
                };
                setAttributes(newAttributes);
                setError('');
              } else {
                setError('Config not loaded');
                setAttributes({preview: false});
              }
            }
          },
          'Embed'
        ),
      );

      const sidebarSettings = createElement(
        PanelBody, {title: 'Settings', initialOpen: true},
        createElement(
          TextControl, {
            label: 'Base Path',
            placeholder: '/panorama/marzipano/project/',
            help: 'Automatically generated by source file.',
            value: attributes.basePath || '',
            type: 'text',
            onChange: (val) => setAttributes({basePath: val}),
          }
        ),
        createElement(
          SelectControl, {
            label: 'Mouse view mode',
            value: attributes.settings.mouseViewMode || 'drag',
            options: [
              {label: 'Drag', value: 'drag'},
              {label: 'QTVR', value: 'qtvr'}
            ],
            onChange: (val) => setAttributes({settings: {...attributes.settings, mouseViewMode: val}}),
          }
        ),
        createElement(
          ToggleControl, {
            label: 'Rotate automatically',
            checked: attributes.settings.autorotateEnabled || false,
            onChange: (val) => setAttributes({settings: {...attributes.settings, autorotateEnabled: val}}),
          }
        ),
        createElement(
          ToggleControl, {
            label: 'Fullscreen button',
            checked: attributes.settings.fullscreenButton || false,
            onChange: (val) => setAttributes({settings: {...attributes.settings, fullscreenButton: val}}),
          }
        ),
        createElement(
          ToggleControl, {
            label: 'Bottom Controls',
            help: 'Add controls at bottom',
            checked: attributes.settings.viewControlButtons || false,
            onChange: (val) => setAttributes({settings: {...attributes.settings, viewControlButtons: val}}),
          }
        )
      );

      const sidebar = createElement(
        InspectorControls, null,
        attributes.preview ? sidebarSettings : null,
      );

      const toolbar = createElement(
        BlockControls, null,
        createElement(
          ToolbarGroup, null,
          attributes.preview ? createElement(
            ToolbarButton, {
              icon: 'edit',
              label: 'Edit URL',
              onClick: () => {
                setAttributes({preview: !attributes.preview});
              },
              isPressed: !attributes.preview
            }
          ): null
        )
      );

      return createElement(
        'div', null, sidebar, toolbar,
        attributes.preview ? marzipanoPreview : editUrl
      );
    },

    save: () => {
      return null;
    },
  });
})(wp);
