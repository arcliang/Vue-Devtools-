/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 19);
/******/ })
/************************************************************************/
/******/ ({

/***/ 14:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = initBackend;
/* harmony export (immutable) */ __webpack_exports__["b"] = getInstanceName;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__highlighter__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__vuex__ = __webpack_require__(28);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__events__ = __webpack_require__(26);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__util__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_path__ = __webpack_require__(65);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_path___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_path__);
// This is the backend that is injected into the page that a Vue app lives in
// when the Vue Devtools panel is activated.







// Use a custom basename functions instead of the shimed version
// because it doesn't work on Windows
function basename (filename, ext) {
  return __WEBPACK_IMPORTED_MODULE_4_path___default.a.basename(
    filename.replace(/^[a-zA-Z]:/, '').replace(/\\/g, '/'),
    ext
  )
}

// hook should have been injected before this executes.
var hook = window.__VUE_DEVTOOLS_GLOBAL_HOOK__
var rootInstances = []
var propModes = ['default', 'sync', 'once']

var instanceMap = window.__VUE_DEVTOOLS_INSTANCE_MAP__ = new Map()
var consoleBoundInstances = Array(5)
var currentInspectedId
var bridge
var filter = ''
var captureCount = 0
var isLegacy = false
var rootUID = 0

function initBackend (_bridge) {
  bridge = _bridge
  if (hook.Vue) {
    isLegacy = hook.Vue.version && hook.Vue.version.split('.')[0] === '1'
    connect()
  } else {
    hook.once('init', connect)
  }
}

function connect () {
  hook.currentTab = 'components'
  bridge.on('switch-tab', function (tab) {
    hook.currentTab = tab
    if (tab === 'components') {
      flush()
    }
  })

  // the backend may get injected to the same page multiple times
  // if the user closes and reopens the devtools.
  // make sure there's only one flush listener.
  hook.off('flush')
  hook.on('flush', function () {
    if (hook.currentTab === 'components') {
      flush()
    }
  })

  bridge.on('select-instance', function (id) {
    currentInspectedId = id
    var instance = instanceMap.get(id)
    if (instance) {
      scrollIntoView(instance)
      __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__highlighter__["a" /* highlight */])(instance)
    }
    bindToConsole(instance)
    flush()
    bridge.send('instance-details', __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__util__["a" /* stringify */])(getInstanceDetails(id)))
  })

  bridge.on('filter-instances', function (_filter) {
    filter = _filter.toLowerCase()
    flush()
  })

  bridge.on('refresh', scan)
  bridge.on('enter-instance', function (id) { return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__highlighter__["a" /* highlight */])(instanceMap.get(id)); })
  bridge.on('leave-instance', __WEBPACK_IMPORTED_MODULE_0__highlighter__["b" /* unHighlight */])

  // vuex
  if (hook.store) {
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__vuex__["a" /* initVuexBackend */])(hook, bridge)
  } else {
    hook.once('vuex:init', function (store) {
      __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__vuex__["a" /* initVuexBackend */])(hook, bridge)
    })
  }

  // events
  __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__events__["a" /* initEventsBackend */])(hook.Vue, bridge)

  bridge.log('backend ready.')
  bridge.send('ready', hook.Vue.version)
  console.log('[vue-devtools] Ready. Detected Vue v' + hook.Vue.version)
  scan()
}

/**
 * Scan the page for root level Vue instances.
 */

function scan () {
  rootInstances.length = 0
  var inFragment = false
  var currentFragment = null
  walk(document, function (node) {
    if (inFragment) {
      if (node === currentFragment._fragmentEnd) {
        inFragment = false
        currentFragment = null
      }
      return true
    }
    var instance = node.__vue__
    if (instance) {
      if (instance._isFragment) {
        inFragment = true
        currentFragment = instance
      }

      // respect Vue.config.devtools option
      var baseVue = instance.constructor
      while (baseVue.super) {
        baseVue = baseVue.super
      }
      if (baseVue.config && baseVue.config.devtools) {
        // give a unique id to root instance so we can
        // 'namespace' its children
        if (typeof instance.__VUE_DEVTOOLS_ROOT_UID__ === 'undefined') {
          instance.__VUE_DEVTOOLS_ROOT_UID__ = ++rootUID
        }
        rootInstances.push(instance)
      }

      return true
    }
  })
  flush()
}

/**
 * DOM walk helper
 *
 * @param {NodeList} nodes
 * @param {Function} fn
 */

function walk (node, fn) {
  if (node.childNodes) {
    for (var i = 0, l = node.childNodes.length; i < l; i++) {
      var child = node.childNodes[i]
      var stop = fn(child)
      if (!stop) {
        walk(child, fn)
      }
    }
  }

  // also walk shadow DOM
  if (node.shadowRoot) {
    walk(node.shadowRoot, fn)
  }
}

/**
 * Called on every Vue.js batcher flush cycle.
 * Capture current component tree structure and the state
 * of the current inspected instance (if present) and
 * send it to the devtools.
 */

function flush () {
  var start
  if (false) {
    captureCount = 0
    start = window.performance.now()
  }
  var payload = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__util__["a" /* stringify */])({
    inspectedInstance: getInstanceDetails(currentInspectedId),
    instances: findQualifiedChildrenFromList(rootInstances)
  })
  if (false) {
    console.log(("[flush] serialized " + captureCount + " instances, took " + (window.performance.now() - start) + "ms."))
  }
  bridge.send('flush', payload)
}

/**
 * Iterate through an array of instances and flatten it into
 * an array of qualified instances. This is a depth-first
 * traversal - e.g. if an instance is not matched, we will
 * recursively go deeper until a qualified child is found.
 *
 * @param {Array} instances
 * @return {Array}
 */

function findQualifiedChildrenFromList (instances) {
  instances = instances
    .filter(function (child) { return !child._isBeingDestroyed; })
  return !filter
    ? instances.map(capture)
    : Array.prototype.concat.apply([], instances.map(findQualifiedChildren))
}

/**
 * Find qualified children from a single instance.
 * If the instance itself is qualified, just return itself.
 * This is ok because [].concat works in both cases.
 *
 * @param {Vue} instance
 * @return {Vue|Array}
 */

function findQualifiedChildren (instance) {
  return isQualified(instance)
    ? capture(instance)
    : findQualifiedChildrenFromList(instance.$children)
}

/**
 * Check if an instance is qualified.
 *
 * @param {Vue} instance
 * @return {Boolean}
 */

function isQualified (instance) {
  var name = getInstanceName(instance).toLowerCase()
  return name.indexOf(filter) > -1
}

/**
 * Capture the meta information of an instance. (recursive)
 *
 * @param {Vue} instance
 * @return {Object}
 */

function capture (instance, _, list) {
  if (false) {
    captureCount++
  }
  // instance._uid is not reliable in devtools as there
  // may be 2 roots with same _uid which causes unexpected
  // behaviour
  instance.__VUE_DEVTOOLS_UID__ = getUniqueId(instance)
  mark(instance)
  var ret = {
    id: instance.__VUE_DEVTOOLS_UID__,
    name: getInstanceName(instance),
    inactive: !!instance._inactive,
    isFragment: !!instance._isFragment,
    children: instance.$children
      .filter(function (child) { return !child._isBeingDestroyed; })
      .map(capture)
  }
  // record screen position to ensure correct ordering
  if ((!list || list.length > 1) && !instance._inactive) {
    var rect = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__highlighter__["c" /* getInstanceRect */])(instance)
    ret.top = rect ? rect.top : Infinity
  } else {
    ret.top = Infinity
  }
  // check if instance is available in console
  var consoleId = consoleBoundInstances.indexOf(instance.__VUE_DEVTOOLS_UID__)
  ret.consoleId = consoleId > -1 ? '$vm' + consoleId : null
  // check router view
  var isRouterView2 = instance.$vnode && instance.$vnode.data.routerView
  if (instance._routerView || isRouterView2) {
    ret.isRouterView = true
    if (!instance._inactive && instance.$route) {
      var matched = instance.$route.matched
      var depth = isRouterView2
        ? instance.$vnode.data.routerViewDepth
        : instance._routerView.depth
      ret.matchedRouteSegment =
        matched &&
        matched[depth] &&
        (isRouterView2 ? matched[depth].path : matched[depth].handler.path)
    }
  }
  return ret
}

/**
 * Mark an instance as captured and store it in the instance map.
 *
 * @param {Vue} instance
 */

function mark (instance) {
  if (!instanceMap.has(instance.__VUE_DEVTOOLS_UID__)) {
    instanceMap.set(instance.__VUE_DEVTOOLS_UID__, instance)
    instance.$on('hook:beforeDestroy', function () {
      instanceMap.delete(instance.__VUE_DEVTOOLS_UID__)
    })
  }
}

/**
 * Get the detailed information of an inspected instance.
 *
 * @param {Number} id
 */

function getInstanceDetails (id) {
  var instance = instanceMap.get(id)
  if (!instance) {
    return {}
  } else {
    return {
      id: id,
      name: getInstanceName(instance),
      state: processProps(instance).concat(
        processState(instance),
        processComputed(instance),
        processRouteContext(instance),
        processVuexGetters(instance),
        processFirebaseBindings(instance),
        processObservables(instance)
      )
    }
  }
}

/**
 * Get the appropriate display name for an instance.
 *
 * @param {Vue} instance
 * @return {String}
 */

function getInstanceName (instance) {
  var name = instance.$options.name || instance.$options._componentTag
  if (name) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__util__["b" /* classify */])(name)
  }
  var file = instance.$options.__file // injected by vue-loader
  if (file) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__util__["b" /* classify */])(basename(file, '.vue'))
  }
  return instance.$root === instance
    ? 'Root'
    : 'Anonymous Component'
}

/**
 * Process the props of an instance.
 * Make sure return a plain object because window.postMessage()
 * will throw an Error if the passed object contains Functions.
 *
 * @param {Vue} instance
 * @return {Array}
 */

function processProps (instance) {
  var props
  if (isLegacy && (props = instance._props)) {
    // 1.x
    return Object.keys(props).map(function (key) {
      var prop = props[key]
      var options = prop.options
      return {
        type: 'props',
        key: prop.path,
        value: instance[prop.path],
        meta: {
          type: options.type ? getPropType(options.type) : 'any',
          required: !!options.required,
          mode: propModes[prop.mode]
        }
      }
    })
  } else if ((props = instance.$options.props)) {
    // 2.0
    var propsData = []
    for (var key in props) {
      var prop = props[key]
      key = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__util__["c" /* camelize */])(key)
      propsData.push({
        type: 'props',
        key: key,
        value: instance[key],
        meta: {
          type: prop.type ? getPropType(prop.type) : 'any',
          required: !!prop.required
        }
      })
    }
    return propsData
  } else {
    return []
  }
}

/**
 * Convert prop type constructor to string.
 *
 * @param {Function} fn
 */

var fnTypeRE = /^(?:function|class) (\w+)/
function getPropType (type) {
  var match = type.toString().match(fnTypeRE)
  return typeof type === 'function'
    ? match && match[1] || 'any'
    : 'any'
}

/**
 * Process state, filtering out props and "clean" the result
 * with a JSON dance. This removes functions which can cause
 * errors during structured clone used by window.postMessage.
 *
 * @param {Vue} instance
 * @return {Array}
 */

function processState (instance) {
  var props = isLegacy
    ? instance._props
    : instance.$options.props
  var getters =
    instance.$options.vuex &&
    instance.$options.vuex.getters
  return Object.keys(instance._data)
    .filter(function (key) { return (
      !(props && key in props) &&
      !(getters && key in getters)
    ); })
    .map(function (key) { return ({
      key: key,
      value: instance._data[key]
    }); })
}

/**
 * Process the computed properties of an instance.
 *
 * @param {Vue} instance
 * @return {Array}
 */

function processComputed (instance) {
  var computed = []
  var defs = instance.$options.computed || {}
  // use for...in here because if 'computed' is not defined
  // on component, computed properties will be placed in prototype
  // and Object.keys does not include
  // properties from object's prototype
  for (var key in defs) {
    var def = defs[key]
    var type = typeof def === 'function' && def.vuex
      ? 'vuex bindings'
      : 'computed'
    // use try ... catch here because some computed properties may
    // throw error during its evaluation
    var computedProp = null
    try {
      computedProp = {
        type: type,
        key: key,
        value: instance[key]
      }
    } catch (e) {
      computedProp = {
        type: type,
        key: key,
        value: '(error during evaluation)'
      }
    }

    computed.push(computedProp)
  }

  return computed
}

/**
 * Process possible vue-router $route context
 *
 * @param {Vue} instance
 * @return {Array}
 */

function processRouteContext (instance) {
  var route = instance.$route
  if (route) {
    var path = route.path;
    var query = route.query;
    var params = route.params;
    var value = { path: path, query: query, params: params }
    if (route.fullPath) { value.fullPath = route.fullPath }
    if (route.hash) { value.hash = route.hash }
    if (route.name) { value.name = route.name }
    if (route.meta) { value.meta = route.meta }
    return [{
      key: '$route',
      value: value
    }]
  } else {
    return []
  }
}

/**
 * Process Vuex getters.
 *
 * @param {Vue} instance
 * @return {Array}
 */

function processVuexGetters (instance) {
  var getters =
    instance.$options.vuex &&
    instance.$options.vuex.getters
  if (getters) {
    return Object.keys(getters).map(function (key) {
      return {
        type: 'vuex getters',
        key: key,
        value: instance[key]
      }
    })
  } else {
    return []
  }
}

/**
 * Process Firebase bindings.
 *
 * @param {Vue} instance
 * @return {Array}
 */

function processFirebaseBindings (instance) {
  var refs = instance.$firebaseRefs
  if (refs) {
    return Object.keys(refs).map(function (key) {
      return {
        type: 'firebase bindings',
        key: key,
        value: instance[key]
      }
    })
  } else {
    return []
  }
}

/**
 * Process vue-rx observable bindings.
 *
 * @param {Vue} instance
 * @return {Array}
 */

function processObservables (instance) {
  var obs = instance.$observables
  if (obs) {
    return Object.keys(obs).map(function (key) {
      return {
        type: 'observables',
        key: key,
        value: instance[key]
      }
    })
  } else {
    return []
  }
}

/**
 * Sroll a node into view.
 *
 * @param {Vue} instance
 */

function scrollIntoView (instance) {
  var rect = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__highlighter__["c" /* getInstanceRect */])(instance)
  if (rect) {
    window.scrollBy(0, rect.top)
  }
}

/**
 * Binds given instance in console as $vm0.
 * For compatibility reasons it also binds it as $vm.
 *
 * @param {Vue} instance
 */

function bindToConsole (instance) {
  var id = instance.__VUE_DEVTOOLS_UID__
  var index = consoleBoundInstances.indexOf(id)
  if (index > -1) {
    consoleBoundInstances.splice(index, 1)
  } else {
    consoleBoundInstances.pop()
  }
  consoleBoundInstances.unshift(id)
  for (var i = 0; i < 5; i++) {
    window['$vm' + i] = instanceMap.get(consoleBoundInstances[i])
  }
  window.$vm = instance
}

/**
 * Returns a devtools unique id for instance.
 * @param {Vue} instance
 */
function getUniqueId (instance) {
  var rootVueId = instance.$root.__VUE_DEVTOOLS_ROOT_UID__
  return (rootVueId + ":" + (instance._uid))
}


/***/ }),

/***/ 19:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_src_backend__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_src_bridge__ = __webpack_require__(7);
// this is injected to the app page when the panel is activated.




window.addEventListener('message', handshake)

function handshake (e) {
  if (e.data.source === 'vue-devtools-proxy' && e.data.payload === 'init') {
    window.removeEventListener('message', handshake)

    var listeners = []
    var bridge = new __WEBPACK_IMPORTED_MODULE_1_src_bridge__["a" /* default */]({
      listen: function listen (fn) {
        var listener = function (evt) {
          if (evt.data.source === 'vue-devtools-proxy' && evt.data.payload) {
            fn(evt.data.payload)
          }
        }
        window.addEventListener('message', listener)
        listeners.push(listener)
      },
      send: function send (data) {
        window.postMessage({
          source: 'vue-devtools-backend',
          payload: data
        }, '*')
      }
    })

    bridge.on('shutdown', function () {
      listeners.forEach(function (l) {
        window.removeEventListener('message', l)
      })
      listeners = []
    })

    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_src_backend__["a" /* initBackend */])(bridge)
  }
}


/***/ }),

/***/ 26:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = initEventsBackend;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__util__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__index__ = __webpack_require__(14);



var internalRE = /^(?:pre-)?hook:/

function initEventsBackend (Vue, bridge) {
  var recording = true

  bridge.on('events:toggle-recording', function (enabled) {
    recording = enabled
  })

  function logEvent (vm, type, eventName, payload) {
    // The string check is important for compat with 1.x where the first
    // argument may be an object instead of a string.
    // this also ensures the event is only logged for direct $emit (source)
    // instead of by $dispatch/$broadcast
    if (typeof eventName === 'string' && !internalRE.test(eventName)) {
      bridge.send('event:triggered', __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__util__["a" /* stringify */])({
        eventName: eventName,
        type: type,
        payload: payload,
        instanceId: vm._uid,
        instanceName: __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__index__["b" /* getInstanceName */])(vm._self || vm),
        timestamp: Date.now()
      }))
    }
  }

  function wrap (method) {
    var original = Vue.prototype[method]
    if (original) {
      Vue.prototype[method] = function () {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        var res = original.apply(this, args)
        if (recording) {
          logEvent(this, method, args[0], args.slice(1))
        }
        return res
      }
    }
  }

  wrap('$emit')
  wrap('$broadcast')
  wrap('$dispatch')
}


/***/ }),

/***/ 27:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = highlight;
/* harmony export (immutable) */ __webpack_exports__["b"] = unHighlight;
/* harmony export (immutable) */ __webpack_exports__["c"] = getInstanceRect;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__util__ = __webpack_require__(3);


var overlay = document.createElement('div')
overlay.style.backgroundColor = 'rgba(104, 182, 255, 0.35)'
overlay.style.position = 'fixed'
overlay.style.zIndex = '99999999999999'
overlay.style.pointerEvents = 'none'

/**
 * Highlight an instance.
 *
 * @param {Vue} instance
 */

function highlight (instance) {
  if (!instance) { return }
  var rect = getInstanceRect(instance)
  if (rect) {
    showOverlay(rect)
  }
}

/**
 * Remove highlight overlay.
 */

function unHighlight () {
  if (overlay.parentNode) {
    document.body.removeChild(overlay)
  }
}

/**
 * Get the client rect for an instance.
 *
 * @param {Vue} instance
 * @return {Object}
 */

function getInstanceRect (instance) {
  if (!__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__util__["d" /* inDoc */])(instance.$el)) {
    return
  }
  if (instance._isFragment) {
    return getFragmentRect(instance)
  } else if (instance.$el.nodeType === 1) {
    return instance.$el.getBoundingClientRect()
  }
}

/**
 * Highlight a fragment instance.
 * Loop over its node range and determine its bounding box.
 *
 * @param {Vue} instance
 * @return {Object}
 */

function getFragmentRect (ref) {
  var _fragmentStart = ref._fragmentStart;
  var _fragmentEnd = ref._fragmentEnd;

  var top, bottom, left, right
  util().mapNodeRange(_fragmentStart, _fragmentEnd, function (node) {
    var rect
    if (node.nodeType === 1 || node.getBoundingClientRect) {
      rect = node.getBoundingClientRect()
    } else if (node.nodeType === 3 && node.data.trim()) {
      rect = getTextRect(node)
    }
    if (rect) {
      if (!top || rect.top < top) {
        top = rect.top
      }
      if (!bottom || rect.bottom > bottom) {
        bottom = rect.bottom
      }
      if (!left || rect.left < left) {
        left = rect.left
      }
      if (!right || rect.right > right) {
        right = rect.right
      }
    }
  })
  return {
    top: top,
    left: left,
    width: right - left,
    height: bottom - top
  }
}

/**
 * Get the bounding rect for a text node using a Range.
 *
 * @param {Text} node
 * @return {Rect}
 */

var range = document.createRange()
function getTextRect (node) {
  range.selectNode(node)
  return range.getBoundingClientRect()
}

/**
 * Display the overlay with given rect.
 *
 * @param {Rect}
 */

function showOverlay (ref) {
  var width = ref.width; if ( width === void 0 ) width = 0;
  var height = ref.height; if ( height === void 0 ) height = 0;
  var top = ref.top; if ( top === void 0 ) top = 0;
  var left = ref.left; if ( left === void 0 ) left = 0;

  overlay.style.width = ~~width + 'px'
  overlay.style.height = ~~height + 'px'
  overlay.style.top = ~~top + 'px'
  overlay.style.left = ~~left + 'px'
  document.body.appendChild(overlay)
}

/**
 * Get Vue's util
 */

function util () {
  return window.__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue.util
}


/***/ }),

/***/ 28:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = initVuexBackend;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_src_util__ = __webpack_require__(3);


function initVuexBackend (hook, bridge) {
  var store = hook.store
  var recording = true

  var getSnapshot = function () { return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_src_util__["a" /* stringify */])({
    state: store.state,
    getters: store.getters
  }); }

  bridge.send('vuex:init', getSnapshot())

  // deal with multiple backend injections
  hook.off('vuex:mutation')

  // application -> devtool
  hook.on('vuex:mutation', function (mutation) {
    if (!recording) { return }
    bridge.send('vuex:mutation', {
      mutation: {
        type: mutation.type,
        payload: __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_src_util__["a" /* stringify */])(mutation.payload)
      },
      timestamp: Date.now(),
      snapshot: getSnapshot()
    })
  })

  // devtool -> application
  bridge.on('vuex:travel-to-state', function (state) {
    hook.emit('vuex:travel-to-state', state)
  })

  bridge.on('vuex:import-state', function (state) {
    hook.emit('vuex:travel-to-state', state)
    bridge.send('vuex:init', getSnapshot())
  })

  bridge.on('vuex:toggle-recording', function (enabled) {
    recording = enabled
  })
}


/***/ }),

/***/ 3:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return classify; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return camelize; });
/* harmony export (immutable) */ __webpack_exports__["d"] = inDoc;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return UNDEFINED; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return INFINITY; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return NAN; });
/* harmony export (immutable) */ __webpack_exports__["a"] = stringify;
/* harmony export (immutable) */ __webpack_exports__["e"] = parse;
/* harmony export (immutable) */ __webpack_exports__["i"] = isPlainObject;
/* harmony export (immutable) */ __webpack_exports__["k"] = searchDeepInObject;
/* harmony export (immutable) */ __webpack_exports__["j"] = sortByKey;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_circular_json_es6__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_circular_json_es6___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_circular_json_es6__);


function cached (fn) {
  var cache = Object.create(null)
  return function cachedFn (str) {
    var hit = cache[str]
    return hit || (cache[str] = fn(str))
  }
}

var classifyRE = /(?:^|[-_/])(\w)/g
var classify = cached(function (str) {
  return str.replace(classifyRE, toUpper)
})

var camelizeRE = /-(\w)/g
var camelize = cached(function (str) {
  return str.replace(camelizeRE, toUpper)
})

function toUpper (_, c) {
  return c ? c.toUpperCase() : ''
}

function inDoc (node) {
  if (!node) { return false }
  var doc = node.ownerDocument.documentElement
  var parent = node.parentNode
  return doc === node ||
    doc === parent ||
    !!(parent && parent.nodeType === 1 && (doc.contains(parent)))
}

/**
 * Stringify/parse data using CircularJSON.
 */

var UNDEFINED = '__vue_devtool_undefined__'
var INFINITY = '__vue_devtool_infinity__'
var NAN = '__vue_devtool_nan__'

function stringify (data) {
  return __WEBPACK_IMPORTED_MODULE_0_circular_json_es6___default.a.stringify(data, replacer)
}

function replacer (key, val) {
  if (val === undefined) {
    return UNDEFINED
  } else if (val === Infinity) {
    return INFINITY
  } else if (Number.isNaN(val)) {
    return NAN
  } else if (val instanceof RegExp) {
    // special handling of native type
    return ("[native RegExp " + (val.toString()) + "]")
  } else {
    return sanitize(val)
  }
}

function parse (data, revive) {
  return revive
    ? __WEBPACK_IMPORTED_MODULE_0_circular_json_es6___default.a.parse(data, reviver)
    : __WEBPACK_IMPORTED_MODULE_0_circular_json_es6___default.a.parse(data)
}

function reviver (key, val) {
  if (val === UNDEFINED) {
    return undefined
  } else if (val === INFINITY) {
    return Infinity
  } else if (val === NAN) {
    return NaN
  } else {
    return val
  }
}

/**
 * Sanitize data to be posted to the other side.
 * Since the message posted is sent with structured clone,
 * we need to filter out any types that might cause an error.
 *
 * @param {*} data
 * @return {*}
 */

function sanitize (data) {
  if (
    !isPrimitive(data) &&
    !Array.isArray(data) &&
    !isPlainObject(data)
  ) {
    // handle types that will probably cause issues in
    // the structured clone
    return Object.prototype.toString.call(data)
  } else {
    return data
  }
}

function isPlainObject (obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

function isPrimitive (data) {
  if (data == null) {
    return true
  }
  var type = typeof data
  return (
    type === 'string' ||
    type === 'number' ||
    type === 'boolean'
  )
}

function searchDeepInObject (obj, searchTerm) {
  var match = false
  var keys = Object.keys(obj)
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    var value = obj[key]
    if (compare(key, searchTerm) || compare(value, searchTerm)) {
      match = true
      break
    }
    if (isPlainObject(value)) {
      match = searchDeepInObject(value, searchTerm)
      if (match) {
        break
      }
    }
  }
  return match
}

function compare (mixedValue, stringValue) {
  if (Array.isArray(mixedValue) && searchInArray(mixedValue, stringValue.toLowerCase())) {
    return true
  }
  if (('' + mixedValue).toLowerCase().indexOf(stringValue.toLowerCase()) !== -1) {
    return true
  }
  return false
}

function searchInArray (arr, searchTerm) {
  var found = false
  for (var i = 0; i < arr.length; i++) {
    if (('' + arr[i]).toLowerCase().indexOf(searchTerm) !== -1) {
      found = true
      break
    }
  }
  return found
}

function sortByKey (state) {
  return state && state.slice().sort(function (a, b) {
    if (a.key < b.key) { return -1 }
    if (a.key > b.key) { return 1 }
    return 0
  })
}

/***/ }),

/***/ 65:
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(66)))

/***/ }),

/***/ 66:
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),

/***/ 7:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_events__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_events___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_events__);


var Bridge = (function (EventEmitter) {
  function Bridge (wall) {
    EventEmitter.call(this)
    // Setting `this` to `self` here to fix an error in the Safari build:
    // ReferenceError: Cannot access uninitialized variable.
    // The error might be related to the webkit bug here:
    // https://bugs.webkit.org/show_bug.cgi?id=171543
    var self = this
    self.setMaxListeners(Infinity)
    self.wall = wall
    wall.listen(function (message) {
      if (typeof message === 'string') {
        self.emit(message)
      } else {
        self.emit(message.event, message.payload)
      }
    })
  }

  if ( EventEmitter ) Bridge.__proto__ = EventEmitter;
  Bridge.prototype = Object.create( EventEmitter && EventEmitter.prototype );
  Bridge.prototype.constructor = Bridge;

  /**
   * Send an event.
   *
   * @param {String} event
   * @param {*} payload
   */

  Bridge.prototype.send = function send (event, payload) {
    this.wall.send({
      event: event,
      payload: payload
    })
  };

  /**
   * Log a message to the devtools background page.
   *
   * @param {String} message
   */

  Bridge.prototype.log = function log (message) {
    this.send('log', message)
  };

  return Bridge;
}(__WEBPACK_IMPORTED_MODULE_0_events__["EventEmitter"]));

/* harmony default export */ __webpack_exports__["a"] = (Bridge);


/***/ }),

/***/ 8:
/***/ (function(module, exports) {

function encode (data, replacer, list, seen) {
  var stored, key, value, i, l
  var seenIndex = seen.get(data)
  if (seenIndex != null) {
    return seenIndex
  }
  var index = list.length
  if (isPlainObject(data)) {
    stored = {}
    seen.set(data, index)
    list.push(stored)
    var keys = Object.keys(data)
    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i]
      value = data[key]
      if (replacer) {
        value = replacer.call(data, key, value)
      }
      stored[key] = encode(value, replacer, list, seen)
    }
  } else if (Array.isArray(data)) {
    stored = []
    seen.set(data, index)
    list.push(stored)
    for (i = 0, l = data.length; i < l; i++) {
      value = data[i]
      if (replacer) {
       value = replacer.call(data, i, value)
      }
      stored[i] = encode(value, replacer, list, seen)
    }
  } else {
    index = list.length
    list.push(data)
  }
  return index
}

function decode (list, reviver) {
  var i = list.length
  var j, k, data, key, value
  while (i--) {
    var data = list[i]
    if (isPlainObject(data)) {
      var keys = Object.keys(data)
      for (j = 0, k = keys.length; j < k; j++) {
        key = keys[j]
        value = list[data[key]]
        if (reviver) value = reviver.call(data, key, value)
        data[key] = value
      }
    } else if (Array.isArray(data)) {
      for (j = 0, k = data.length; j < k; j++) {
        value = list[data[j]]
        if (reviver) value = reviver.call(data, j, value)
        data[j] = value
      }
    }
  }
}

function isPlainObject (obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

exports.stringify = function stringify (data, replacer, space) {
  try {
    return arguments.length === 1
      ? JSON.stringify(data)
      : JSON.stringify(data, replacer, space)
  } catch (e) {
    return exports.stringifyStrict(data, replacer, space)
  }
}

exports.parse = function parse (data, reviver) {
  var hasCircular = /^\s/.test(data)
  if (!hasCircular) {
    return arguments.length === 1
      ? JSON.parse(data)
      : JSON.parse(data, reviver)
  } else {
    var list = JSON.parse(data)
    decode(list, reviver)
    return list[0]
  }
}

exports.stringifyStrict = function (data, replacer, space) {
  var list = []
  encode(data, replacer, list, new Map())
  return space
    ? ' ' + JSON.stringify(list, null, space)
    : ' ' + JSON.stringify(list)
}


/***/ }),

/***/ 9:
/***/ (function(module, exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}


/***/ })

/******/ });