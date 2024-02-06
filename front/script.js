
const updateQuantityBtn = document.querySelector('.btn.btn-outline-primary')
const dropdownBtn = document.querySelector('.btn-dropdown')
const assetDropDownBtn = document.querySelector('#assets')

let chartAsset = 'bitcoin'
let intervalId;

if (updateQuantityBtn) updateQuantityBtn.addEventListener('click', sendQuantityToServer)
if (dropdownBtn) dropdownBtn.addEventListener('click', toggleDropdown)
if (assetDropDownBtn) {
    assetDropDownBtn.addEventListener('change', function () {
        updateGraphConttroller({ asset: assetDropDownBtn.value })
    })
}

if (assetDropDownBtn) updateGraphConttroller({ asset: chartAsset })

// function requestGraphDataFromServer(asset) {
//     // console.log(asset);
//     // const response = await fetch('/graphdata', {
//     //     method: 'POST',
//     //     headers: {
//     //         'Content-Type': 'application/json',
//     //     },
//     //     body: JSON.stringify(asset),
//     // })
//     // const data = await response.json();
//     // chartAsset = data.asset
//     console.log(asset.asset);
//     if (assetDropDownBtn) updateGraphConttroller({ asset: asset.asset })
// }

function updateGraphSrcOnHomePage(assetName) {
    const img = document.querySelector('.img-fluid')
    const timestamp = new Date().getTime();
    const imgSrc = `../img/${assetName.asset}.png?timestamp=${timestamp}`;
    img.src = imgSrc
}

function updateGraphConttroller(asset) {
    updateGraphSrcOnHomePage(asset)
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(() => {
        updateGraphSrcOnHomePage(asset)
    }, 15000)
}

function retrieveQuantitiesFromInputs() {
    const inputs = document.querySelectorAll('.input_node')
    const inputValues = Array.from(inputs).map(input => ({ name: input.name, value: input.value }));
    return inputValues;
}

async function sendQuantityToServer() {
    const quantities = retrieveQuantitiesFromInputs()
    const response = await fetch("http://192.168.1.111/updatequantities", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(quantities),
    })
    response.ok ? displayAlert('.alert.alert-success') : displayAlert('.alert.alert-danger')
}

function displayAlert(className) {
    const alert = document.querySelector(className)
    alert.classList.remove('d-none')
    setTimeout(() => {
        alert.classList.add('d-none')
    }, 2000)
}

function toggleDropdown() {
    const dropdown = document.querySelector('.menu-dropdown')
    dropdown.classList.toggle('display-dropdown')
}

const eventSource = new EventSource('/total');

eventSource.onmessage = (event) => {
    const { total } = JSON.parse(event.data);
    const totalNode = document.querySelector('.total-balance-value')
    const totalPortfolioNode = document.querySelector('.total-portfolio-value')
    if (totalNode) {
        totalNode.classList.add('updated-value')
        totalNode.textContent = `${total}€`
        setTimeout(() => {
            totalNode.classList.remove('updated-value')
        }, 100)
    }
    if (totalPortfolioNode) {
        totalPortfolioNode.textContent = `${total}€`
    }
};

eventSource.onerror = function (error) {
    console.error("EventSource error:", JSON.stringify(error));
};