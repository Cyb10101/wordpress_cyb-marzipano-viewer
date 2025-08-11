(() => {
  const {createElement, useState} = wp.element;
  const {registerBlockType} = wp.blocks;
  const {TextareaControl, TextControl, PanelBody, SelectControl, ToggleControl, ToolbarGroup, ToolbarButton} = wp.components;
  const {BlockControls} = wp.blockEditor || wp.editor;
  const {InspectorControls} = wp.blockEditor;

  const CustomUploadControl = ({onDataLoaded}) => {
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState(false);
    const [timeoutMessage, setTimeoutMessage] = useState(null);

    const handleFile = (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (timeoutMessage) {
          clearTimeout(timeoutMessage);
          setTimeoutMessage(null);
        }
        setError(false);

        try {
          let data = e.target.result;
          if (file.name.endsWith('.js')) {
            const matches = data.match(/var\s+APP_DATA\s*=\s*(\{[\s\S]*\});/);
            if (matches && matches.length > 0) {
              data = matches[1];
            } else {
              setError(true);
            }
          }

          onDataLoaded(data);
          setFileName(file.name);
        } catch (err) {
          console.error('Invalid file', err);
        }

        setTimeoutMessage(setTimeout(() => {setFileName(''); setError(false);}, 5000));
      };
      reader.readAsText(file);
    };

    const handleChange = (e) => {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    };

    return createElement('div', null,
      createElement('div', {
        style: {
          flex: '0 1 auto',  alignSelf : 'center', display: 'block', textTransform: 'uppercase',
          fontSize: '11px', fontWeight: '500', lineHeight: '1.4', marginBottom: '8px', padding: '0px'
        }
      }, 'Load data.js or config.json'),
      createElement('div', {
        style: {display: 'flex', gap: '10px', alignItems: 'flex-start'}
      }, createElement('input', {
          type: 'file',
          accept: '.json,.js',
          onChange: handleChange,
          style: {flex: '1 1 auto'}
        }),
        fileName && createElement('div', {
          style: {flex: '1 1 auto', fontSize: '0.8em', textAlign: 'end', alignSelf : 'center'}
        }, !error ? `✅ ${fileName} loaded.` : `⚠️ ${fileName} loaded, but not successfully parsed!`)
      )
    );
  }

  registerBlockType('cyb/marzipano-viewer', {
    title: 'Cyb Marzipano Viewer',
    icon: 'format-image',
    category: 'embed',

    attributes: {
      uid: {type: 'string', default: ''},
      json: {type: 'string', default: ''},
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
      const {attributes, clientId, setAttributes} = props;
      setAttributes({uid: clientId});

      const previewId = 'cyb-marzipano-preview_' + attributes.uid;
      const uniqueKey = JSON.stringify(attributes);

      // Preview
      let marzipanoPreview = null;
      try {
        let configAttributes = {...attributes};
        delete configAttributes.json;
        delete configAttributes.preview;

        const config = {
          ...JSON.parse(attributes.json),
          ...configAttributes
        };
        marzipanoPreview = createElement('div', {key: uniqueKey, id: previewId, className: 'cyb-marzipano', style: {}, 'data-config': JSON.stringify(config)});
      } catch (exception) {
        marzipanoPreview = createElement('p', null, '⚠️ Invalid JSON config');
      }

      const updateConfig = (json) => {
        try {
          const config = JSON.parse(json);
          if (config.hasOwnProperty('basePath')) {
            attributes.basePath = config.basePath !== '' ? config.basePath : '';
          }

          if (config.hasOwnProperty('settings')) {
            const settings = attributes.settings;
            if (config.settings.hasOwnProperty('mouseViewMode')) {
              settings.mouseViewMode = config.settings.mouseViewMode === 'qtvr' ? 'qtvr' : 'drag';
            }
            if (config.settings.hasOwnProperty('autorotateEnabled')) {
              settings.autorotateEnabled = (config.settings.autorotateEnabled === true);
            }
            if (config.settings.hasOwnProperty('fullscreenButton')) {
              settings.fullscreenButton = (config.settings.fullscreenButton === true);
            }
            if (config.settings.hasOwnProperty('viewControlButtons')) {
              settings.viewControlButtons = (config.settings.viewControlButtons === true);
            }
            attributes.settings = settings;
          }
        } catch (exception) {
          // console.error(exception.message);
        }
      }

      // Json Editor
      const marzipanoEditor = createElement('div', null,
        createElement(TextareaControl, {
          label: 'Marzipano JSON Config',
          value: attributes.json,
          onChange: value => {
            updateConfig(value);
            setAttributes({json: value});
          },
          rows: 15,
        }),
        createElement(CustomUploadControl, {
          onDataLoaded: (data) => {
            updateConfig(data);
            setAttributes({json: data});
            if (attributes.basePath && attributes.basePath !== '') {
              setAttributes({preview: true});
            }
          }
        })
      );

      return createElement('div', null,
        createElement(InspectorControls, null,
          createElement(PanelBody, {title: 'Settings', initialOpen: true},
            createElement(TextControl, {
              label: 'Base Path',
              value: attributes.basePath || '/',
              type: 'text',
              onChange: (val) => setAttributes({basePath: val}),
            }),
            createElement(SelectControl, {
              label: 'Mouse view mode',
              value: attributes.settings.mouseViewMode || 'drag',
              options: [
                {label: 'Drag', value: 'drag'},
                {label: 'QTVR', value: 'qtvr'}
              ],
              onChange: (val) => setAttributes({settings: {...attributes.settings, mouseViewMode: val}}),
            }),
            createElement(ToggleControl, {
              label: 'Rotate automatically',
              checked: attributes.settings.autorotateEnabled || false,
              onChange: (val) => setAttributes({settings: {...attributes.settings, autorotateEnabled: val}}),
            }),
            createElement(ToggleControl, {
              label: 'Fullscreen button',
              checked: attributes.settings.fullscreenButton || false,
              onChange: (val) => setAttributes({settings: {...attributes.settings, fullscreenButton: val}}),
            }),
            createElement(ToggleControl, {
              label: 'Bottom Controls',
              help: 'Add controls at bottom',
              checked: attributes.settings.viewControlButtons || false,
              onChange: (val) => setAttributes({settings: {...attributes.settings, viewControlButtons: val}}),
            })
          ),
        ),
        createElement(BlockControls, null,
          createElement(ToolbarGroup, null,
              createElement(ToolbarButton, {
                  icon: attributes.preview ? 'visibility' : 'hidden',
                  label: attributes.preview ? 'Hide Preview' : 'Show Preview',
                  onClick: () => setAttributes({ preview: !attributes.preview }),
                  isPressed: attributes.preview,
              })
          )
        ),
        attributes.preview ? marzipanoPreview : marzipanoEditor
      );
    },

    save: () => {
      return null;
    },
  });
})(wp);
