fetch('http://localhost:3000/header')
.then(response => response.json())
.then(data => {
    document.getElementById('header').innerHTML = data.header;
});

fetch('http://localhost:3000/footer')
.then(response => response.json())
.then(data => {
    document.getElementById('footer').innerHTML = data.footer;
});