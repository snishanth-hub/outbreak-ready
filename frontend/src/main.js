import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import './style.css'

const API_URL = import.meta.env.VITE_API_URL

const map = L.map('map', { center: [22, 78], zoom: 4 })

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map)

const statusEl = document.getElementById('status')
const statusTextEl = document.getElementById('status-text')
const locateBtn = document.getElementById('btn-locate')
const refreshBtn = document.getElementById('btn-refresh')
const refreshIcon = refreshBtn.querySelector('.refresh')
const radiusInput = document.getElementById('radius')
const radiusValue = document.getElementById('radius-value')
const blurInput = document.getElementById('blur')
const blurValue = document.getElementById('blur-value')

let heatLayer = null
let allPoints = []

function setStatus(message, state = 'ok') {
  statusEl.className = `status ${state}`
  statusTextEl.textContent = message
}

function setButtonsDisabled(disabled) {
  locateBtn.disabled = disabled
  refreshBtn.disabled = disabled
}

function locateUser() {
  if (!navigator.geolocation) {
    setStatus('Geolocation is not supported by this browser.', 'error')
    return
  }
  setStatus('Requesting location permission...', 'loading')
  locateBtn.disabled = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords
      map.setView([latitude, longitude], 10)
      setStatus(`Centered on your location (within ~${Math.round(accuracy)}m).`)
      locateBtn.disabled = false
    },
    (error) => {
      setStatus(`Location denied: ${error.message}. Using default view.`, 'error')
      locateBtn.disabled = false
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  )
}

function renderHeatmap() {
  if (heatLayer) {
    heatLayer.setLatLngs(allPoints)
    heatLayer.setOptions({
      radius: Number(radiusInput.value),
      blur: Number(blurInput.value),
    })
  } else if (allPoints.length) {
    heatLayer = L.heatLayer(allPoints, {
      radius: Number(radiusInput.value),
      blur: Number(blurInput.value),
      maxZoom: 14,
      max: 1,
      gradient: {
        0.2: '#2b83ba',
        0.4: '#abdda4',
        0.6: '#fee08b',
        0.8: '#fdae61',
        1.0: '#d7191c',
      },
    })
    heatLayer.addTo(map)
    map.fitBounds(heatLayer.getBounds())
  }
}

async function loadHeatmap() {
  if (!API_URL) {
    setStatus(
      'VITE_API_URL is not set. Create a .env file with VITE_API_URL pointing at your backend.',
      'error'
    )
    return
  }
  setStatus('Loading heatmap data...', 'loading')
  setButtonsDisabled(true)
  refreshIcon.classList.add('spinning')
  try {
    const response = await fetch(`${API_URL}/heatmap-data`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const data = await response.json()
    const maxPopulation = data.reduce(
      (max, item) => Math.max(max, item.population),
      0
    )
    allPoints = data.map((item) => [
      item.lat,
      item.lon,
      maxPopulation ? item.population / maxPopulation : 0,
    ])
    if (!allPoints.length) {
      setStatus('No heatmap data returned from the backend.', 'error')
      return
    }
    renderHeatmap()
    setStatus(`${allPoints.length.toLocaleString()} points rendered.`)
  } catch (error) {
    setStatus(`Failed to load heatmap data: ${error.message}`, 'error')
  } finally {
    setButtonsDisabled(false)
    refreshIcon.classList.remove('spinning')
  }
}

radiusInput.addEventListener('input', () => {
  radiusValue.textContent = radiusInput.value
  renderHeatmap()
})

blurInput.addEventListener('input', () => {
  blurValue.textContent = blurInput.value
  renderHeatmap()
})

locateBtn.addEventListener('click', locateUser)
refreshBtn.addEventListener('click', loadHeatmap)

locateUser()
loadHeatmap()
