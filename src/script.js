const $console = document.getElementById('console')
const $sidebar = document.getElementById('sidebar')

window.serverlessAPI.functions().then(functions => {
  Object.entries(functions).forEach(([name, info]) => {
    addFunction(name, info)
  });
})

window.serverlessAPI.handleLog('dequeue', (event, data) => {
  addLog(data)
})

function addFunction(name, info) {
  const $element = renderFunction(name, info)
  $sidebar.appendChild($element)
}

function renderFunction(name, info) {
  const $container = document.createElement('div')
  const $title = document.createElement('h3')
  const $description = document.createElement('p')

  $title.innerText = name
  $description.innerText = info.description
  
  $container.classList = ['func']
  $container.append($title, $description)

  return $container
}

function addLog(data) {
  const logElement = renderLog(data)
  $console.appendChild(logElement)
}

function renderLog(log) {
  const div = document.createElement('div')

  div.classList = ['log']

  log.split('\n').forEach(lineText => {
    const line = renderLine(lineText)
    div.appendChild(line)
  });

  return div
}

function renderLine(text) {
  const div = document.createElement('div')

  if (isJsonString(text)) {
    div.innerText = text
    div.classList = ['json']
  } else {
    div.innerText = text
    div.classList = ['line']
  }

  return div
}

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}