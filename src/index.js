/* global HTMLElement customElements */
import { alchemize, refresh } from 'html-alchemist'
import { container } from './templates/container'
import { Api } from './api'

// TODO set this value based on build-time conditions!!
const api = Api.fromBaseURL('https://api.portlanddsa.org/')

// TODO break into actual views. these are placeholders!
const views = {
  '': () => alchemize(['h1.title', 'Welcome!']),
  'account': () => alchemize(['h1.title', 'Your Account']),
  'bodies': () => alchemize(['h1.title', 'Chapter Bodies']),
  'members': () => alchemize(['h1.title', 'Chapter Members']),
}

function refreshMainWithHashView (views, urlHash) {
  const match = Object.keys(views)
    .filter((viewPattern) => {
      const viewRe = new RegExp(viewPattern)
      return viewRe.exec(urlHash)
    })
    .toSorted().toReversed()[0] // match the most specific (longest) match
  const viewFn = match ? views[match] : views['']
  refresh('main', viewFn())
}

class MainComponent extends HTMLElement {
  async connectedCallback () {
    const handleRefresh = () => refreshMainWithHashView(views, document.location.hash)
    window.addEventListener('popstate', handleRefresh)
    this.replaceChildren(alchemize(container()))
    handleRefresh()
  }
}

customElements.define('main-component', MainComponent)
