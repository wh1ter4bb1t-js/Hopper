const form = document.querySelector('form');
const errorElement = document.querySelector('.error-message');
const loadingElement = document.querySelector('.loading');
const hopsElement = document.querySelector('.hops');
const loadMoreElement = document.querySelector('#loadMore');
const API_URL = 'http://localhost:5000/hops';

let skip = 0;
let limit = 10;
let loading = false;
let finished = false;

errorElement.style.display = 'none';
loadingElement.style.display = 'none';

document.addEventListener('scroll', () => {
  const rect = loadMoreElement.getBoundingClientRect();
  if (rect.top < window.innerHeight && !loading && !finished) {
    loadMore();
  }
});

listAllHops();

form.addEventListener('submit', event => {
  event.preventDefault();
  const formData = new FormData(form);
  const name = formData.get('name');
  const content = formData.get('content');

  if (name.trim() && content.trim()) {
    errorElement.style.display = 'none';
    form.style.display = 'none';
    loadingElement.style.display = '';

    const hop = {
      name,
      content
    };

    console.log(hop);

    fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(hop),
      headers: {
        'content-type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType.includes('json')) {
            return response.json().then(error => Promise.reject(error.message));
          } else {
            return response.text().then(message => Promise.reject(message));
          }
        }
      })
      .then(() => {
        form.reset();
        setTimeout(() => {
          form.style.display = '';
        }, 3000);
        listAllHops();
      })
      .catch(errorMessage => {
        form.style.display = '';
        errorElement.textContent = errorMessage;
        errorElement.style.display = '';
        loadingElement.style.display = 'none';
      });
  } else {
    errorElement.textContent = 'Name and content are required!';
    errorElement.style.display = '';
  }
});

function loadMore() {
  skip += limit;
  listAllHops(false);
}

function listAllHops(reset = true) {
  loading = true;
  if (reset) {
    hopsElement.innerHTML = '';
    skip = 0;
    finished = false;
  }
  fetch(`${API_URL}?skip=${skip}&limit=${limit}`)
    .then(response => response.json())
    .then(result => {
      result.hops.forEach(hop => {
        const div = document.createElement('div');
        const header = document.createElement('h3');
        const contents = document.createElement('p');
        const date = document.createElement('small');

        header.textContent = hop.name;
        contents.textContent = hop.content;
        date.textContent = new Date(hop.created);

        div.appendChild(header);
        div.appendChild(contents);
        div.appendChild(date);

        hopsElement.appendChild(div);
      });
      loadingElement.style.display = 'none';
      if (!result.meta.has_more) {
        loadMoreElement.style.visibility = 'hidden';
        finished = true;
      } else {
        loadMoreElement.style.visibility = 'visible';
      }
      loading = false;
    });
}
