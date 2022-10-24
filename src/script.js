const $sidebar = document.getElementById('sidebar')
const $tab_group = document.querySelector('.tab-group')
const $tab_items = document.querySelector('.tab-items')

window.serverlessAPI.onStart((event, functions) => {
  Object.entries(functions).forEach(([name, info]) => {
    addFunction(name, info)
  });
})

function selectTab(name) {
  const $tab = document.querySelector(`.tab.${name}`)
  const $console = document.querySelector(`.console.${name}`)

  if (!$tab.classList.contains('active')) {
    document.querySelector(`.tab.active`)?.classList.remove('active')
    document.querySelector(`.console.active`)?.classList.remove('active')

    $tab.classList.add('active')
    $console.classList.add('active')
  }
}

function logStart(name, info) {
  const $console = renderConsole(name, info)
  const $tab = renderTab(name, handleClose)
  
  function handleLog(event, data) {
    const $log = renderLog(data)
    $console.appendChild($log)
    $console.scrollBy({
      top: $console.scrollHeight,
      behavior: 'smooth',
    })
  }

  function handleClose(event) {
    event.preventDefault()

    window.serverlessAPI.logStop(name, handleLog)
      .then(() => {
        const $nextTab = document.querySelector('.tab:not(.active)')

        if ($tab.classList.contains('active') && $nextTab) {
          selectTab($nextTab.classList[1])
        }
        
        $console.remove()
        $tab.remove()
      })
  }
  
  window.serverlessAPI.logStart(name, handleLog)
    .then(() => {
      $tab_group.appendChild($tab)
      $tab_items.appendChild($console)
      $tab.onclick = () => selectTab(name)

      selectTab(name)
    })
    .catch(() => {
      $console.remove()
      $tab.remove()
    })
}

function addFunction(name, info) {
  const $element = renderFunction(name, info)

  $sidebar.appendChild($element)
  $element.onclick = () => logStart(name, info)
}

function renderFunction(name, info) {
  const $container = document.createElement('div')
  const $title = document.createElement('h3')
  const $description = document.createElement('p')

  $title.innerText = name
  $description.innerText = info.description
  
  $container.classList.add('func')
  $container.append($title, $description)

  return $container
}

function renderTab(name, onClose) {
  const $tab = document.createElement('div')
  const $title = document.createElement('span')
  const $close = document.createElement('div')

  $close.classList.add('close')
  $tab.classList.add('tab', name)

  $title.innerText = name
  $close.innerText = 'x'
  $close.addEventListener('click', onClose)

  $tab.append($title, $close)

  return $tab
}

function renderConsole(name, info) {
  const $container = document.createElement('div')
  $container.classList.add('console', name)
  return $container
}

function renderLog(log) {
  const $container = document.createElement('pre')

  $container.classList.add('log')

  log.split('\n').forEach(lineText => {
    const line = renderLine(lineText)
    $container.appendChild(line)
  });

  return $container
}

function renderLine(text) {
  const $line = document.createElement('div')

  if (isJsonString(text)) {
    $line.innerText = text
    $line.classList.add('json')
  } else {
    $line.innerText = text
    $line.classList.add('line')
  }

  return $line
}

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}