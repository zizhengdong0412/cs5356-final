"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/get-proto";
exports.ids = ["vendor-chunks/get-proto"];
exports.modules = {

/***/ "(rsc)/./node_modules/get-proto/Object.getPrototypeOf.js":
/*!*********************************************************!*\
  !*** ./node_modules/get-proto/Object.getPrototypeOf.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\nvar $Object = __webpack_require__(/*! es-object-atoms */ \"(rsc)/./node_modules/es-object-atoms/index.js\");\n/** @type {import('./Object.getPrototypeOf')} */ module.exports = $Object.getPrototypeOf || null;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvZ2V0LXByb3RvL09iamVjdC5nZXRQcm90b3R5cGVPZi5qcyIsIm1hcHBpbmdzIjoiQUFBQTtBQUVBLElBQUlBLFVBQVVDLG1CQUFPQSxDQUFDO0FBRXRCLDhDQUE4QyxHQUM5Q0MsT0FBT0MsT0FBTyxHQUFHSCxRQUFRSSxjQUFjLElBQUkiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9yZWNpcGUta2VlcGVyLy4vbm9kZV9tb2R1bGVzL2dldC1wcm90by9PYmplY3QuZ2V0UHJvdG90eXBlT2YuanM/ZmIzNyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciAkT2JqZWN0ID0gcmVxdWlyZSgnZXMtb2JqZWN0LWF0b21zJyk7XG5cbi8qKiBAdHlwZSB7aW1wb3J0KCcuL09iamVjdC5nZXRQcm90b3R5cGVPZicpfSAqL1xubW9kdWxlLmV4cG9ydHMgPSAkT2JqZWN0LmdldFByb3RvdHlwZU9mIHx8IG51bGw7XG4iXSwibmFtZXMiOlsiJE9iamVjdCIsInJlcXVpcmUiLCJtb2R1bGUiLCJleHBvcnRzIiwiZ2V0UHJvdG90eXBlT2YiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/get-proto/Object.getPrototypeOf.js\n");

/***/ }),

/***/ "(rsc)/./node_modules/get-proto/Reflect.getPrototypeOf.js":
/*!**********************************************************!*\
  !*** ./node_modules/get-proto/Reflect.getPrototypeOf.js ***!
  \**********************************************************/
/***/ ((module) => {

eval("\n/** @type {import('./Reflect.getPrototypeOf')} */ module.exports = typeof Reflect !== \"undefined\" && Reflect.getPrototypeOf || null;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvZ2V0LXByb3RvL1JlZmxlY3QuZ2V0UHJvdG90eXBlT2YuanMiLCJtYXBwaW5ncyI6IkFBQUE7QUFFQSwrQ0FBK0MsR0FDL0NBLE9BQU9DLE9BQU8sR0FBRyxPQUFRQyxZQUFZLGVBQWVBLFFBQVFDLGNBQWMsSUFBSyIsInNvdXJjZXMiOlsid2VicGFjazovL3JlY2lwZS1rZWVwZXIvLi9ub2RlX21vZHVsZXMvZ2V0LXByb3RvL1JlZmxlY3QuZ2V0UHJvdG90eXBlT2YuanM/M2IyNSJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbi8qKiBAdHlwZSB7aW1wb3J0KCcuL1JlZmxlY3QuZ2V0UHJvdG90eXBlT2YnKX0gKi9cbm1vZHVsZS5leHBvcnRzID0gKHR5cGVvZiBSZWZsZWN0ICE9PSAndW5kZWZpbmVkJyAmJiBSZWZsZWN0LmdldFByb3RvdHlwZU9mKSB8fCBudWxsO1xuIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJSZWZsZWN0IiwiZ2V0UHJvdG90eXBlT2YiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/get-proto/Reflect.getPrototypeOf.js\n");

/***/ }),

/***/ "(rsc)/./node_modules/get-proto/index.js":
/*!*****************************************!*\
  !*** ./node_modules/get-proto/index.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\nvar reflectGetProto = __webpack_require__(/*! ./Reflect.getPrototypeOf */ \"(rsc)/./node_modules/get-proto/Reflect.getPrototypeOf.js\");\nvar originalGetProto = __webpack_require__(/*! ./Object.getPrototypeOf */ \"(rsc)/./node_modules/get-proto/Object.getPrototypeOf.js\");\nvar getDunderProto = __webpack_require__(/*! dunder-proto/get */ \"(rsc)/./node_modules/dunder-proto/get.js\");\n/** @type {import('.')} */ module.exports = reflectGetProto ? function getProto(O) {\n    // @ts-expect-error TS can't narrow inside a closure, for some reason\n    return reflectGetProto(O);\n} : originalGetProto ? function getProto(O) {\n    if (!O || typeof O !== \"object\" && typeof O !== \"function\") {\n        throw new TypeError(\"getProto: not an object\");\n    }\n    // @ts-expect-error TS can't narrow inside a closure, for some reason\n    return originalGetProto(O);\n} : getDunderProto ? function getProto(O) {\n    // @ts-expect-error TS can't narrow inside a closure, for some reason\n    return getDunderProto(O);\n} : null;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvZ2V0LXByb3RvL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFBO0FBRUEsSUFBSUEsa0JBQWtCQyxtQkFBT0EsQ0FBQztBQUM5QixJQUFJQyxtQkFBbUJELG1CQUFPQSxDQUFDO0FBRS9CLElBQUlFLGlCQUFpQkYsbUJBQU9BLENBQUM7QUFFN0Isd0JBQXdCLEdBQ3hCRyxPQUFPQyxPQUFPLEdBQUdMLGtCQUNkLFNBQVNNLFNBQVNDLENBQUM7SUFDcEIscUVBQXFFO0lBQ3JFLE9BQU9QLGdCQUFnQk87QUFDeEIsSUFDRUwsbUJBQ0MsU0FBU0ksU0FBU0MsQ0FBQztJQUNwQixJQUFJLENBQUNBLEtBQU0sT0FBT0EsTUFBTSxZQUFZLE9BQU9BLE1BQU0sWUFBYTtRQUM3RCxNQUFNLElBQUlDLFVBQVU7SUFDckI7SUFDQSxxRUFBcUU7SUFDckUsT0FBT04saUJBQWlCSztBQUN6QixJQUNFSixpQkFDQyxTQUFTRyxTQUFTQyxDQUFDO0lBQ3BCLHFFQUFxRTtJQUNyRSxPQUFPSixlQUFlSTtBQUN2QixJQUNFIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcmVjaXBlLWtlZXBlci8uL25vZGVfbW9kdWxlcy9nZXQtcHJvdG8vaW5kZXguanM/NWExMyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbnZhciByZWZsZWN0R2V0UHJvdG8gPSByZXF1aXJlKCcuL1JlZmxlY3QuZ2V0UHJvdG90eXBlT2YnKTtcbnZhciBvcmlnaW5hbEdldFByb3RvID0gcmVxdWlyZSgnLi9PYmplY3QuZ2V0UHJvdG90eXBlT2YnKTtcblxudmFyIGdldER1bmRlclByb3RvID0gcmVxdWlyZSgnZHVuZGVyLXByb3RvL2dldCcpO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLicpfSAqL1xubW9kdWxlLmV4cG9ydHMgPSByZWZsZWN0R2V0UHJvdG9cblx0PyBmdW5jdGlvbiBnZXRQcm90byhPKSB7XG5cdFx0Ly8gQHRzLWV4cGVjdC1lcnJvciBUUyBjYW4ndCBuYXJyb3cgaW5zaWRlIGEgY2xvc3VyZSwgZm9yIHNvbWUgcmVhc29uXG5cdFx0cmV0dXJuIHJlZmxlY3RHZXRQcm90byhPKTtcblx0fVxuXHQ6IG9yaWdpbmFsR2V0UHJvdG9cblx0XHQ/IGZ1bmN0aW9uIGdldFByb3RvKE8pIHtcblx0XHRcdGlmICghTyB8fCAodHlwZW9mIE8gIT09ICdvYmplY3QnICYmIHR5cGVvZiBPICE9PSAnZnVuY3Rpb24nKSkge1xuXHRcdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdnZXRQcm90bzogbm90IGFuIG9iamVjdCcpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gQHRzLWV4cGVjdC1lcnJvciBUUyBjYW4ndCBuYXJyb3cgaW5zaWRlIGEgY2xvc3VyZSwgZm9yIHNvbWUgcmVhc29uXG5cdFx0XHRyZXR1cm4gb3JpZ2luYWxHZXRQcm90byhPKTtcblx0XHR9XG5cdFx0OiBnZXREdW5kZXJQcm90b1xuXHRcdFx0PyBmdW5jdGlvbiBnZXRQcm90byhPKSB7XG5cdFx0XHRcdC8vIEB0cy1leHBlY3QtZXJyb3IgVFMgY2FuJ3QgbmFycm93IGluc2lkZSBhIGNsb3N1cmUsIGZvciBzb21lIHJlYXNvblxuXHRcdFx0XHRyZXR1cm4gZ2V0RHVuZGVyUHJvdG8oTyk7XG5cdFx0XHR9XG5cdFx0XHQ6IG51bGw7XG4iXSwibmFtZXMiOlsicmVmbGVjdEdldFByb3RvIiwicmVxdWlyZSIsIm9yaWdpbmFsR2V0UHJvdG8iLCJnZXREdW5kZXJQcm90byIsIm1vZHVsZSIsImV4cG9ydHMiLCJnZXRQcm90byIsIk8iLCJUeXBlRXJyb3IiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/get-proto/index.js\n");

/***/ })

};
;