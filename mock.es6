import R from 'ramda'

// Mock ajax requests for flyd-ajax

let handlers = {}
let cachedXMLHttpRequest = null

// Catch a request to a url and mock the response
function handle(method, url, resp) {
  handlers[method.toLowerCase() + ' ' + url] = resp
}

// Overwrite XMLHttpRequest
function setup() {
  cachedXMLHttpRequest = window.XMLHttpRequest
  window.XMLHttpRequest = function() {
    this.headers = {}
    this.body = ''
    this.response = ''
    this.eventListeners = {}
    this.realRequest = new cachedXMLHttpRequest()
    return this
  }

  window.XMLHttpRequest.prototype.addEventListener = function(name, fn) {
    this.eventListeners[name] = fn
    this.realRequest.addEventListener.apply(this.realRequest, arguments)
    return this
  }

  window.XMLHttpRequest.prototype.getResponseHeader = function(name, fn) {
    return this.headers[name]
  }

  // No-op
  window.XMLHttpRequest.prototype.setRequestHeader = function(name, val) {
    this.realRequest.setRequestHeader.apply(this.realRequest, arguments)
    return this
  }

  window.XMLHttpRequest.prototype.send = function(strData) {
    const handler = handlers[this.method + ' ' + this.url]
    if(!handler) {
      log('requested without handler: ' + this.method + ' ' + this.url)
      log('current handlers:', R.keys(handlers))
      return this.realRequest.send.apply(this.realRequest, arguments)
    } else {
      log('handled: ' + this.method + ' ' + this.url)
    }
    const result = handler
    if(!result.dontResolve) {
      this.body = result.body
      this.headers = R.merge(this.headers, result.headers || {})
      this.status = result.status
      this.eventListeners.load()
    }
    return this
  }

  window.XMLHttpRequest.prototype.open = function(method, url, bool) {
    this.method = method.toLowerCase()
    this.url = url
    this.realRequest.open.apply(this.realRequest, arguments)
    return this
  }
}

function teardown() {
  window.XMLHttpRequest = cachedXMLHttpRequest
}

function log(msg) {
  if(console && console.log) console.log('flyd-ajax/mock:', msg)
}


module.exports = {handle, setup, teardown}

