if (!('window' in globalThis)) {
  Object.defineProperty(globalThis, 'window', {
    value: globalThis,
    configurable: true,
  });
}

if (!('document' in globalThis)) {
  Object.defineProperty(globalThis, 'document', {
    value: {
      getAnimations() {
        return [];
      },
      scrollingElement: null,
    },
    configurable: true,
    writable: true,
  });
}

if (!('Element' in globalThis)) {
  class Element {}
  Element.prototype.getAnimations = function() {
    return [];
  };
  Element.prototype.animate = function() {
    return {};
  };
  Object.defineProperty(globalThis, 'Element', {
    value: Element,
    configurable: true,
    writable: true,
  });
}

if (!('Animation' in globalThis)) {
  Object.defineProperty(globalThis, 'Animation', {
    value: class Animation {},
    configurable: true,
    writable: true,
  });
}

if (!('requestAnimationFrame' in globalThis)) {
  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    value: (callback) => setTimeout(() => callback(0), 0),
    configurable: true,
    writable: true,
  });
}

if (!('addEventListener' in globalThis)) {
  Object.defineProperty(globalThis, 'addEventListener', {
    value: () => {},
    configurable: true,
    writable: true,
  });
}

if (!('removeEventListener' in globalThis)) {
  Object.defineProperty(globalThis, 'removeEventListener', {
    value: () => {},
    configurable: true,
    writable: true,
  });
}
