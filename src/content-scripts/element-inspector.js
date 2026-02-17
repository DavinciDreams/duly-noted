/**
 * Element Inspector
 * Inspects and extracts information from DOM elements.
 */

window.DulyNoted.ElementInspector = class ElementInspector {
  constructor() {
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;
  }

  /**
   * Inspect an element by its ID
   * @param {string} elementId
   * @returns {Promise<Object>}
   */
  async inspect(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }
    return this.getElementData(element);
  }

  /**
   * Get element info by CSS selector
   * @param {string} selector
   * @returns {Promise<Object>}
   */
  async getElementInfo(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element with selector "${selector}" not found`);
    }
    return this.getElementData(element);
  }

  /**
   * Extract comprehensive data from an element
   * @param {Element} element
   * @returns {Object}
   */
  getElementData(element) {
    const rect = element.getBoundingClientRect();
    const computedStyles = window.getComputedStyle(element);

    return {
      id: this.generateElementId(element),
      tagName: element.tagName,
      className: element.className,
      idAttribute: element.id,
      outerHTML: element.outerHTML,
      innerHTML: element.innerHTML,
      innerText: element.innerText,
      textContent: element.textContent,
      attributes: this.getElementAttributes(element),
      computedStyles: this.getComputedStyles(computedStyles),
      position: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      scrollPosition: {
        scrollX: window.scrollX,
        scrollY: window.scrollY
      },
      xpath: this.getXPath(element),
      cssSelector: this.getCssSelector(element),
      children: this.getChildrenInfo(element),
      parent: this.getParentInfo(element)
    };
  }

  getElementAttributes(element) {
    const attributes = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }
    return attributes;
  }

  getComputedStyles(computedStyles) {
    return {
      display: computedStyles.display,
      position: computedStyles.position,
      visibility: computedStyles.visibility,
      opacity: computedStyles.opacity,
      color: computedStyles.color,
      backgroundColor: computedStyles.backgroundColor,
      fontSize: computedStyles.fontSize,
      fontFamily: computedStyles.fontFamily,
      fontWeight: computedStyles.fontWeight,
      lineHeight: computedStyles.lineHeight,
      padding: computedStyles.padding,
      margin: computedStyles.margin,
      border: computedStyles.border,
      borderRadius: computedStyles.borderRadius,
      boxShadow: computedStyles.boxShadow,
      zIndex: computedStyles.zIndex,
      cursor: computedStyles.cursor,
      pointerEvents: computedStyles.pointerEvents
    };
  }

  getChildrenInfo(element, maxChildren = 10) {
    const children = [];
    const childElements = Array.from(element.children).slice(0, maxChildren);
    childElements.forEach(child => {
      children.push({
        tagName: child.tagName,
        id: child.id,
        className: child.className
      });
    });
    return children;
  }

  getParentInfo(element) {
    if (!element.parentElement) {
      return null;
    }
    return {
      tagName: element.parentElement.tagName,
      id: element.parentElement.id,
      className: element.parentElement.className
    };
  }

  getXPath(element) {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    const parts = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling = current.previousSibling;

      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }

      const tagName = current.tagName.toLowerCase();
      const part = index > 0 ? `${tagName}[${index + 1}]` : tagName;
      parts.unshift(part);

      current = current.parentNode;
    }

    return parts.length ? `/${parts.join('/')}` : '';
  }

  getCssSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }

    const path = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      }

      if (current.className) {
        const classes = current.className.split(' ').filter(c => c);
        if (classes.length > 0) {
          selector += `.${classes.join('.')}`;
        }
      }

      path.unshift(selector);
      current = current.parentNode;
    }

    return path.join(' > ');
  }

  generateElementId(element) {
    if (element.id) {
      return element.id;
    }

    const tagName = element.tagName.toLowerCase();
    const className = element.className || '';
    const index = Array.from(element.parentElement?.children || []).indexOf(element);

    return `${tagName}_${className.replace(/\s+/g, '_')}_${index}`;
  }

  findElementByXPath(xpath) {
    return document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
  }

  findElementBySelector(selector) {
    return document.querySelector(selector);
  }
};
