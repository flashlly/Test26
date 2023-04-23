const cryptoNameElement = document.getElementById('crypto-name');
const priceElement = document.getElementById('price');
const priceChartElement = document.getElementById('price-chart');
const switchToEthButton = document.getElementById('switch-to-eth');
const switchToBtcButton = document.getElementById('switch-to-btc');
const cryptoInputElement = document.getElementById('crypto-input');
const usdOutputElement = document.getElementById('usd-output');

async function fetchCryptoPrice(crypto) {
  const cryptoId = crypto === 'bitcoin' ? 'bitcoin' : 'ethereum';
  const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`);
  const data = await response.json();
  return data[cryptoId].usd;
}

async function displayPrice(crypto) {
  try {
    const price = await fetchCryptoPrice(crypto);
    priceElement.textContent = `$${price.toFixed(2)}`;
    updateConversionOutput(price);
  } catch (error) {
    priceElement.textContent = 'Error fetching price';
    console.error(error);
  }
}

async function fetchCryptoPriceHistory(crypto) {
  const cryptoId = crypto === 'bitcoin' ? 'bitcoin' : 'ethereum';
  const response = await fetch(`https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=30&interval=daily`);
  const data = await response.json();
  const priceHistory = data.prices.map(([timestamp, price]) => {
    return {
      date: new Date(timestamp).toISOString().slice(0, 10),
      price: price,
    };
  });

  const priceHistoryObject = {};
  priceHistory.forEach(({ date, price }) => {
    priceHistoryObject[date] = price;
  });

  return priceHistoryObject;
}

async function displayPriceChart(crypto, color) {
  const priceHistory = await fetchCryptoPriceHistory(crypto);
  const chartData = {
    labels: Object.keys(priceHistory),
    datasets: [
      {
        data: Object.values(priceHistory).map((price) => parseFloat(price.toFixed(2))),
        borderColor: color,
        fill: false,
      },
    ],
  };

  if (window.priceChart) {
    window.priceChart.destroy();
  }

  window.priceChart = new Chart(priceChartElement.getContext('2d'), {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          display: false,
        },
        y: {
          beginAtZero: false,
          ticks: {
            // Include a dollar sign in the ticks
            callback: function (value, index, values) {
              return '$' + value;
            },
          },
        },
      },
      plugins: {
        tooltip: {
          mode: 'nearest',
          intersect: false,
          callbacks: {
            label: function (context) {
              return '$' + context.parsed.y.toFixed(2);
            },
          },
        },
      },
    },
  });
}

function updateConversionOutput(cryptoPrice) {
  const cryptoAmount = parseFloat(cryptoInputElement.value);
  if (!isNaN(cryptoAmount)) {
    usdOutputElement.textContent = `$${(cryptoAmount * cryptoPrice).toFixed(2)}`;
  } else {
    usdOutputElement.textContent = '';
  }
}

cryptoInputElement.addEventListener('keypress', async (event) => {
  if (event.key === 'Enter') {
    const crypto = switchToBtcButton.hidden ? 'bitcoin' : 'ethereum';
    const price = await fetchCryptoPrice(crypto);
    updateConversionOutput(price);
  }
});

switchToEthButton.addEventListener('click', async () => {
  cryptoNameElement.textContent = 'Ethereum Price';
  switchToEthButton.hidden = true;
  switchToBtcButton.hidden = false;
  await displayPrice('ethereum');
  await displayPriceChart('ethereum', 'purple');
  cryptoInputElement.placeholder = 'ETH Amount';
});

switchToBtcButton.addEventListener('click', async () => {
  cryptoNameElement.textContent = 'Bitcoin Price';
  switchToEthButton.hidden = false;
  switchToBtcButton.hidden = true;
  await displayPrice('bitcoin');
  await displayPriceChart('bitcoin', 'blue');
  cryptoInputElement.placeholder = 'BTC amount';
});

displayPrice('bitcoin');
displayPriceChart('bitcoin', 'blue');