// DOM Elements
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const locationButton = document.getElementById('location-button');
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const currentTemp = document.getElementById('current-temp');
const weatherIcon = document.getElementById('weather-icon');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const weatherCondition = document.getElementById('weather-condition');
const forecastDaysContainer = document.getElementById('forecast-days');
const loadingSpinner = document.getElementById('loading-spinner');


const API_KEY = 'dac6921a41ac9d55a5ec782c71d54e9b';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Initialize app with default location
document.addEventListener('DOMContentLoaded', () => {
    getWeatherByLocation('London');
});

// Event Listeners
searchButton.addEventListener('click', () => {
    const location = searchInput.value.trim();
    if (location) {
        getWeatherByLocation(location);
    }
});

locationButton.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoords(latitude, longitude);
            },
            error => {
                alert('Unable to retrieve your location. Please enable location services or search manually.');
                console.error('Geolocation error:', error);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser. Please search manually.');
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const location = searchInput.value.trim();
        if (location) {
            getWeatherByLocation(location);
        }
    }
});

// API Functions
async function getWeatherByLocation(location) {
    showLoading();
    try {
        const response = await fetch(`${BASE_URL}/weather?q=${location}&units=metric&appid=${API_KEY}`);
        const data = await handleResponse(response);
        
        updateCurrentWeather(data);
        await getForecast(data.coord.lat, data.coord.lon);
    } catch (error) {
        handleError(error);
    } finally {
        hideLoading();
    }
}

async function getWeatherByCoords(lat, lon) {
    showLoading();
    try {
        const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        const data = await handleResponse(response);
        
        updateCurrentWeather(data);
        await getForecast(lat, lon);
    } catch (error) {
        handleError(error);
    } finally {
        hideLoading();
    }
}

async function getForecast(lat, lon) {
    try {
        const response = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        const data = await handleResponse(response);
        updateForecast(data);
    } catch (error) {
        console.error('Error fetching forecast:', error);
    }
}

// Helper Functions
async function handleResponse(response) {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch weather data');
    }
    return response.json();
}

function handleError(error) {
    alert(`Error: ${error.message}`);
    console.error('Error:', error);
}

function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

// Update UI Functions
function updateCurrentWeather(data) {
    cityName.textContent = `${data.name}, ${data.sys.country || ''}`;
    
    const now = new Date();
    currentDate.textContent = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    currentTemp.textContent = `${Math.round(data.main.temp)}°`;
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    weatherIcon.alt = data.weather[0].description;
    
    feelsLike.textContent = `Feels like: ${Math.round(data.main.feels_like)}°`;
    humidity.textContent = `Humidity: ${data.main.humidity}%`;
    windSpeed.textContent = `Wind: ${Math.round(data.wind.speed * 3.6)} km/h`;
    weatherCondition.textContent = data.weather[0].main;
}

function updateForecast(data) {
    // Clear previous forecast
    forecastDaysContainer.innerHTML = '';
    
    // Group forecast by day
    const dailyForecast = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' });
        if (!dailyForecast[date]) {
            dailyForecast[date] = [];
        }
        dailyForecast[date].push(item);
    });
    
    // Get the next 5 days (excluding today)
    const forecastDates = Object.keys(dailyForecast).slice(1, 6);
    
    // Create forecast items
    forecastDates.forEach(date => {
        const dayData = dailyForecast[date];
        const dayTemp = dayData.reduce((sum, item) => sum + item.main.temp, 0) / dayData.length;
        const nightTemp = dayData.reduce((sum, item) => sum + item.main.temp_min, 0) / dayData.length;
        const weather = dayData[Math.floor(dayData.length / 2)].weather[0];
        
        const forecastDay = document.createElement('div');
        forecastDay.className = 'forecast-day';
        forecastDay.innerHTML = `
            <p>${date}</p>
            <img src="https://openweathermap.org/img/wn/${weather.icon}@2x.png" 
                 alt="${weather.description}" 
                 class="forecast-icon">
            <div class="forecast-temp">
                <span>${Math.round(dayTemp)}°</span>
                <span>${Math.round(nightTemp)}°</span>
            </div>
        `;
        
        forecastDaysContainer.appendChild(forecastDay);
    });
}