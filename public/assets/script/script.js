var gcaptchaWidgetId1
var gcaptchaCallback = () => {
  gcaptchaWidgetId1 = grecaptcha.render('gcaptchaWidgetId1', {
    'sitekey' : '6Ldc_G0UAAAAAH3GUU9o2ZhL3Mf5t9c9jxUXXH2s', // Your reCaptcha Public Key
    'theme' : 'light'
  })
}
    
const apiCall = (apiCallUrl, fetchMethod, fetchArgsObj, fetchHeadersObj) =>
  new Promise((resolve, reject) => {
    const options = {
      method: fetchMethod || 'GET',
      body: fetchArgsObj ? JSON.stringify(fetchArgsObj) : {},
      headers: fetchHeadersObj || {}
    }
    options.headers['Content-Type'] = 'application/json'
    fetch(apiCallUrl, options)
      .then(res => res.json())
      .then(resolve)
      .catch(reject)
  })

const checkMoodleAccount = (moodleLogin, password) => 
  apiCall('/checkMoodleAccount', 'POST', {
    moodleLogin,
    password,
    gcaptchaReponse: grecaptcha.getResponse(gcaptchaWidgetId1)
  })

const handleForm = (form, event, gcaptchaReponse) => {
  event.preventDefault()
  const moodleLogin = form.querySelector('#moodleLogin').value
  const password = form.querySelector('#password').value
  const error = form.querySelector('#error')
  const button = form.querySelector('#submit')

  if (!moodleLogin || !password) {
    error.classList.remove('hidden')
    error.innerText = 'Tous les champs sont obligatoires.'
    return
  }

  error.classList.add('hidden')
  button.setAttribute('disabled', 'disabled')

  checkMoodleAccount(moodleLogin, password, gcaptchaReponse)
    .then(res => {
      if (res && res.success) {
        form.innerHTML = ''

        const d = document
        const newDiv = d.createElement('div')

        const content = {}
        content.title = d.createElement('h3')
        content.title.appendChild(d.createTextNode('Connexion réussie.'))

        content.topMsg = d.createElement('p')
        content.topMsg.appendChild(d.createTextNode(`Votre code d'appairage Discord est le suivant :`))

        content.code = d.createElement('h4')
        content.code.appendChild(d.createTextNode(res.pairCode))

        content.bottomMsg = d.createElement('p')
        content.bottomMsg.appendChild(d.createTextNode(`Utilisez la commande "!relierDiscord ${res.pairCode}".`))

        Object.keys(content).forEach(node => newDiv.appendChild(content[node]))
        form.appendChild(newDiv)
        form.classList.add('animated')
        form.classList.add('zoomInDown')
      }
      else {
        error.classList.remove('hidden')
        error.innerText = res.hasOwnProperty('msg') ? res.msg : ''
        button.removeAttribute('disabled')
        grecaptcha.reset()
      }
    })
    .catch(console.error)
}