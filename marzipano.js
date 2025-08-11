'use strict';
/*
Based on Marzipano's example viewer (style.css)
Modified for integration with WordPress Gutenberg
*/

class CybMarzipano {
  initialize() {
    const instance = this;
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (node.matches && node.matches('.cyb-marzipano')) {
            instance.run(node);
          } else {
            const marzipanoChild = node.querySelector && node.querySelector('.cyb-marzipano');
            if (marzipanoChild) {
              instance.run(marzipanoChild);
            }
          }
        }
        });
      });
    });
    observer.observe(document.body, {childList: true, subtree: true});
  }

  renderViewer(containerId, config = null) {
    this.run(document.getElementById(containerId), config);
  }

  run(container, config = null) {
    const instance = this;
    if (container.dataset.initialized) {return;} else {container.dataset.initialized = 1;}

    if (config) {
      this.config = config
    } else {
      this.config = JSON.parse(container.dataset.config);
    }

    var Marzipano = window.Marzipano;
    this.currentSceneIndex = 0;

    const panoElement = this.createPanorama(container);
    this.createHeader(container);

    this.sceneListElement = this.createSceneList(container, this.config);
    this.sceneElements = this.sceneListElement.querySelectorAll('.scene');

    this.sceneListToggleElement = null;
    if (config.scenes.length > 1) {
      this.sceneListToggleElement = this.createHeaderActionButton(0, 'sceneListToggle', 'expand.png', 'collapse.png');
    }

    this.toggleDeviceOrientation = this.createHeaderActionButton(1, 'toggleDeviceOrientation', 'device-orientation-enable.png', 'device-orientation-disable.png');
    this.autorotateToggleElement = this.createHeaderActionButton(1, 'autorotateToggle', 'play.png', 'pause.png');
    let fullscreenToggleElement = null;
    if (config.settings.fullscreenButton) {
      fullscreenToggleElement = this.createHeaderActionButton(1, 'fullscreenToggle', 'fullscreen.png', 'windowed.png');
    }

    this.detectDevice(container);
    this.detectDeviceTouch(container);

    if (config.settings.fullscreenButton) {
      this.detectFullscreen(container, this.config, fullscreenToggleElement);
    }

    // Initialize viewer
    this.viewer = new Marzipano.Viewer(panoElement, {
      controls: {
        mouseViewMode: this.config.settings.mouseViewMode
      }
    });

    this.createScenes(container, config);

    // Set up autorotate, if enabled
    this.autorotate = Marzipano.autorotate({
      yawSpeed: 0.03,
      targetPitch: 0,
      targetFov: Math.PI/2
    });
    if (this.config.settings.autorotateEnabled) {
      this.autorotateToggleElement.classList.add('enabled');
    }

    // Set handler for autorotate toggle.
    this.autorotateToggleElement.addEventListener('click', () => {
      instance.toggleAutorotate();
    });

    // Set handler for scene list toggle.
    this.sceneListToggleElement.addEventListener('click', () => {
      instance.toggleSceneList();
    });

    // Start with the scene list open on desktop.
    if (!container.classList.contains('mobile')) {
      this.showSceneList();
    }

    // Set handler for scene switch.
    this.scenes.forEach(function(scene) {
      var el = instance.sceneListElement.querySelector('.scene[data-id="' + scene.data.id + '"]');
      el.addEventListener('click', () => {
        instance.switchScene(scene);
        // On mobile, hide scene list after selecting a scene.
        if (container.classList.contains('mobile')) {
          instance.hideSceneList();
        }
      });
    });


    if (config.settings.viewControlButtons) {
      this.bottomControls(container);
    }

    this.deviceOrientation();
    this.switchScene(this.scenes[this.currentSceneIndex]); // Display the initial scene
  }

  getImagePath() {
    if (typeof cybLocalize === 'object' && cybLocalize.hasOwnProperty('pluginsUrl')) {
      return cybLocalize.pluginsUrl + '/vendor/images/';
    } else {
      return 'img/';
    }
  }

  createPanorama(container) {
    const panorama = document.createElement('div');
    panorama.classList.add('marzipano-panorama');
    container.appendChild(panorama);
    return panorama;
  }

  createHeader(container) {
    const header = document.createElement('div');
    header.classList.add('header');

    const actionLeft = document.createElement('div');
    actionLeft.classList.add('action-left');

    const heading = document.createElement('div');
    heading.classList.add('heading');

    const actionRight = document.createElement('div');
    actionRight.classList.add('action-right');

    header.appendChild(actionLeft);
    header.appendChild(heading);
    header.appendChild(actionRight);
    container.appendChild(header);
    this.header = {actionLeft, heading, actionRight};
    return this.header;
  }

  createHeaderActionButton(position, className, imageOff, imageOn) {
    const toggle = document.createElement('div');
    toggle.classList.add(className);

    const imgOff = document.createElement('img');
    imgOff.className = 'off';
    imgOff.src = this.getImagePath() + imageOff;

    const imgOn = document.createElement('img');
    imgOn.className = 'on';
    imgOn.src = this.getImagePath() + imageOn;

    toggle.appendChild(imgOff);
    toggle.appendChild(imgOn);
    this.header['action' + (position === 0 ? 'Left' : 'Right')].appendChild(toggle);
    return toggle;
  }

  changeSceneName(text) {
    this.header.heading.textContent = text;
  }

  createSceneList(container, data) {
    const sceneList = document.createElement('div');
    sceneList.classList.add('sceneList');

    const scenes = document.createElement('ul');
    scenes.classList.add('scenes');

    data.scenes.forEach(scene => {
      const link = document.createElement('a');
      link.href = 'javascript:void(0)';
      link.classList.add('scene');
      link.dataset.id = scene.id;

      const sceneItem = document.createElement('li');
      sceneItem.classList.add('text');
      sceneItem.textContent = scene.name;

      link.appendChild(sceneItem);
      scenes.appendChild(link);
    });
    sceneList.appendChild(scenes);
    container.appendChild(sceneList);
    return sceneList;
  }

  detectDevice(container) {
    if (!window.matchMedia) {
      container.classList.add('desktop');
      return;
    }

    const mql = window.matchMedia('(max-width: 500px), (max-height: 500px)');

    const setMode = () => {
      container.classList.toggle('mobile', mql.matches);
      container.classList.toggle('desktop', !mql.matches);
    };

    setMode();
    mql.addEventListener('change', setMode);
  }

  detectDeviceTouch(container) {
    container.classList.add('no-touch');
    if (!('ontouchstart' in window)) {
      return;
    }

    const handler = () => {
      container.classList.replace('no-touch', 'touch');
      window.removeEventListener('touchstart', handler);
    };

    window.addEventListener('touchstart', handler, {once: true});
  }

  headerAddButton(container, className, imageOff, imageOn) {
    const toggle = document.createElement('a');
    toggle.href = 'javascript:void(0)';
    toggle.classList.add(className);

    const imgOff = document.createElement('img');
    imgOff.className = 'icon off';
    imgOff.src = this.getImagePath() + imageOff;

    const imgOn = document.createElement('img');
    imgOn.className = 'icon on';
    imgOn.src = this.getImagePath() + imageOn;

    toggle.appendChild(imgOff);
    toggle.appendChild(imgOn);
    container.appendChild(toggle);
    return toggle;
  }

  controlAddButton(container, className, image, position) {
    const button = document.createElement('a');
    button.href = 'javascript:void(0)';
    button.classList.add(className, 'viewControlButton', 'viewControlButton-' + position);

    const img = document.createElement('img');
    img.className = 'icon';
    img.src = this.getImagePath() + image;

    button.appendChild(img);
    container.appendChild(button);
    return button;
  }

  detectFullscreen(container, config, fullscreenToggleElement) {
    if (container.requestFullscreen && config.settings.fullscreenButton) {
      fullscreenToggleElement.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          container.requestFullscreen().catch(err => console.warn('Fullscreen failed', err));
        } else {
          document.exitFullscreen();
        }
      });

      document.addEventListener('fullscreenchange', () => {
        fullscreenToggleElement.classList.toggle('enabled', document.fullscreenElement === container);
      });
    }
  }

  bottomControls(container) {
    const controls = this.viewer.controls();
    const velocity = 0.7;
    const friction = 3;

    const viewUpElement = this.controlAddButton(container, 'viewUp', 'up.png', 1);
    const viewDownElement = this.controlAddButton(container, 'viewDown', 'down.png', 2);
    const viewLeftElement = this.controlAddButton(container, 'viewLeft', 'left.png', 3);
    const viewRightElement = this.controlAddButton(container, 'viewRight', 'right.png', 4);
    const viewInElement = this.controlAddButton(container, 'viewIn', 'plus.png', 5);
    const viewOutElement = this.controlAddButton(container, 'viewOut', 'minus.png', 6);

    controls.registerMethod('upElement',    new Marzipano.ElementPressControlMethod(viewUpElement,     'y', -velocity, friction), true);
    controls.registerMethod('downElement',  new Marzipano.ElementPressControlMethod(viewDownElement,   'y',  velocity, friction), true);
    controls.registerMethod('leftElement',  new Marzipano.ElementPressControlMethod(viewLeftElement,   'x', -velocity, friction), true);
    controls.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement,  'x',  velocity, friction), true);
    controls.registerMethod('inElement',    new Marzipano.ElementPressControlMethod(viewInElement,  'zoom', -velocity, friction), true);
    controls.registerMethod('outElement',   new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom',  velocity, friction), true);
  }

  createScenes(container, config) {
    const instance = this;
    this.scenes = config.scenes.map((sceneConfig) => {
      var urlPrefix = config.basePath;
      var source = Marzipano.ImageUrlSource.fromString(
        urlPrefix + "/" + sceneConfig.id + "/{z}/{f}/{y}/{x}.jpg",
        { cubeMapPreviewUrl: urlPrefix + "/" + sceneConfig.id + "/preview.jpg" });
      var geometry = new Marzipano.CubeGeometry(sceneConfig.levels);

      var limiter = Marzipano.RectilinearView.limit.traditional(sceneConfig.faceSize, 100*Math.PI/180, 120*Math.PI/180);
      var view = new Marzipano.RectilinearView(sceneConfig.initialViewParameters, limiter);

      var scene = this.viewer.createScene({
        source: source,
        geometry: geometry,
        view: view,
        pinFirstLevel: true
      });

      // Create link hotspots
      sceneConfig.linkHotspots.forEach((hotspot) => {
        var element = instance.createLinkHotspotElement(container, hotspot);
        scene.hotspotContainer().createHotspot(element, {yaw: hotspot.yaw, pitch: hotspot.pitch});
      });

      // Create info hotspots
      sceneConfig.infoHotspots.forEach((hotspot) => {
        var element = instance.createInfoHotspotElement(container, hotspot);
        scene.hotspotContainer().createHotspot(element, {yaw: hotspot.yaw, pitch: hotspot.pitch});
      });

      return {
        data: sceneConfig,
        scene: scene,
        view: view
      };
    });
  }

  createLinkHotspotElement(container, hotspot) {
    const instance = this;

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('link-hotspot');

    // Create image element.
    var icon = document.createElement('img');
    icon.src = this.getImagePath() + 'link.png';
    icon.classList.add('link-hotspot-icon');

    // Set rotation transform.
    var transformProperties = [ '-ms-transform', '-webkit-transform', 'transform' ];
    for (var i = 0; i < transformProperties.length; i++) {
      var property = transformProperties[i];
      icon.style[property] = 'rotate(' + hotspot.rotation + 'rad)';
    }
    // Add click event handler.
    wrapper.addEventListener('click', () => {
      instance.switchScene(instance.findSceneById(hotspot.target));
    });

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    this.stopTouchAndScrollEventPropagation(wrapper);

    // Create tooltip element.
    var tooltip = document.createElement('div');
    tooltip.classList.add('hotspot-tooltip');
    tooltip.classList.add('link-hotspot-tooltip');
    tooltip.innerHTML = this.findSceneDataById(hotspot.target).name;

    wrapper.appendChild(icon);
    wrapper.appendChild(tooltip);

    return wrapper;
  }

  createInfoHotspotElement(container, hotspot) {
    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('info-hotspot');

    // Create hotspot/tooltip header.
    var header = document.createElement('div');
    header.classList.add('info-hotspot-header');

    // Create image element.
    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('info-hotspot-icon-wrapper');
    var icon = document.createElement('img');
    icon.src = this.getImagePath() + 'info.png';
    icon.classList.add('info-hotspot-icon');
    iconWrapper.appendChild(icon);

    // Create title element.
    var titleWrapper = document.createElement('div');
    titleWrapper.classList.add('info-hotspot-title-wrapper');
    var title = document.createElement('div');
    title.classList.add('info-hotspot-title');
    title.innerHTML = hotspot.title;
    titleWrapper.appendChild(title);

    // Create close element.
    var closeWrapper = document.createElement('div');
    closeWrapper.classList.add('info-hotspot-close-wrapper');
    var closeIcon = document.createElement('img');
    closeIcon.src = this.getImagePath() + 'close.png';
    closeIcon.classList.add('info-hotspot-close-icon');
    closeWrapper.appendChild(closeIcon);

    // Construct header element.
    header.appendChild(iconWrapper);
    header.appendChild(titleWrapper);
    header.appendChild(closeWrapper);

    // Create text element.
    var text = document.createElement('div');
    text.classList.add('info-hotspot-text');
    text.innerHTML = hotspot.text;

    // Place header and text into wrapper element.
    wrapper.appendChild(header);
    wrapper.appendChild(text);

    // Create a modal for the hotspot content to appear on mobile mode.
    var modal = document.createElement('div');
    modal.innerHTML = wrapper.innerHTML;
    modal.classList.add('info-hotspot-modal');
    container.appendChild(modal);

    const toggle = () => {
      wrapper.classList.toggle('visible');
      modal.classList.toggle('visible');
    };

    // Show content when hotspot is clicked.
    wrapper.querySelector('.info-hotspot-header').addEventListener('click', toggle);

    // Hide content when close icon is clicked.
    modal.querySelector('.info-hotspot-close-wrapper').addEventListener('click', toggle);

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    this.stopTouchAndScrollEventPropagation(wrapper);

    return wrapper;
  }

  // Prevent touch and scroll events from reaching the parent element.
  stopTouchAndScrollEventPropagation(element) {
    var eventList = ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel', 'mousewheel'];
    for (var i = 0; i < eventList.length; i++) {
      element.addEventListener(eventList[i], (event) => {
        event.stopPropagation();
      });
    }
  }

  findSceneById(id) {
    for (var i = 0; i < this.scenes.length; i++) {
      if (this.scenes[i].data.id === id) {
        return this.scenes[i];
      }
    }
    return null;
  }

  findSceneDataById(id) {
    for (var i = 0; i < this.config.scenes.length; i++) {
      if (this.config.scenes[i].id === id) {
        return this.config.scenes[i];
      }
    }
    return null;
  }

  sanitize(s) {
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

  switchScene(scene) {
    this.currentSceneIndex = this.scenes.findIndex(obj => obj.data.id === scene.data.id);
    this.stopAutorotate();
    scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo();
    this.startAutorotate();
    this.changeSceneName(this.sanitize(scene.data.name));
    this.updateSceneList(scene);
  }

  updateSceneList(scene) {
    for (var i = 0; i < this.sceneElements.length; i++) {
      var el = this.sceneElements[i];
      if (el.getAttribute('data-id') === scene.data.id) {
        el.classList.add('current');
      } else {
        el.classList.remove('current');
      }
    }
  }

  showSceneList() {
    this.sceneListElement.classList.add('enabled');
    this.sceneListToggleElement.classList.add('enabled');
  }

  hideSceneList() {
    this.sceneListElement.classList.remove('enabled');
    this.sceneListToggleElement.classList.remove('enabled');
  }

  toggleSceneList() {
    this.sceneListElement.classList.toggle('enabled');
    this.sceneListToggleElement.classList.toggle('enabled');
  }

  startAutorotate() {
    const instance = this;
    if (!instance.autorotateToggleElement.classList.contains('enabled')) {
      return;
    }
    this.viewer.startMovement(this.autorotate);
    this.viewer.setIdleMovement(3000, this.autorotate);
  }

  stopAutorotate() {
    this.viewer.stopMovement();
    this.viewer.setIdleMovement(Infinity);
  }

  toggleAutorotate() {
    const instance = this;
    if (instance.autorotateToggleElement.classList.contains('enabled')) {
      this.autorotateToggleElement.classList.remove('enabled');
      this.stopAutorotate();
    } else {
      this.autorotateToggleElement.classList.add('enabled');
      this.startAutorotate();
    }
  }

  deviceOrientation() {
    const instance = this;
    const controls = this.viewer.controls();
    this.deviceOrientationControlMethod = new DeviceOrientationControlMethod();
    controls.registerMethod('deviceOrientation', this.deviceOrientationControlMethod);
    this.deviceOrientationEnabled = false;

    this.toggleDeviceOrientation.addEventListener('click', async () => {
      if (this.deviceOrientationEnabled) {
        controls.disableMethod('deviceOrientation');
        this.deviceOrientationEnabled = false;
        this.toggleDeviceOrientation.classList.remove('enabled');
      } else if (window.DeviceOrientationEvent) {
        if (typeof window.DeviceOrientationEvent.requestPermission == 'function') {
          const granted = await requestIOSPermission();
          if (granted) {
            instance.enableDeviceOrientation();
          }
        } else {
          instance.enableDeviceOrientation();
        }
      }
    });
  }

  requestIOSPermission() {
    return window.DeviceOrientationEvent.requestPermission()
      .then(response => response === 'granted')
      .catch(console.error);
  }

  enableDeviceOrientation() {
    const instance = this;
    const controls = this.viewer.controls();
    this.autorotateToggleElement.classList.remove('enabled');
    instance.stopAutorotate();

    this.deviceOrientationControlMethod.getPitch((err, pitch) => {
      if (!instance.deviceOrientationEnabled) {
        return;
      } else if (!err) {
        instance.scenes[this.currentSceneIndex].view.setPitch(pitch);
      }
    });
    controls.enableMethod('deviceOrientation');
    this.toggleDeviceOrientation.classList.add('enabled');
    this.deviceOrientationEnabled = true;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  (new CybMarzipano).initialize();
});
