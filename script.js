'use strict';

const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.getElementById('main-nav');
if (menuButton && mainNav) {
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    mainNav.classList.toggle('open', !expanded);
  });
  mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    mainNav.classList.remove('open');
  }));
}

const filters = Array.from(document.querySelectorAll('[data-filter]'));
const projects = Array.from(document.querySelectorAll('[data-categories]'));
const projectTotal = projects.length;
const featuredTotal = projects.filter(card => (card.dataset.categories || '').split(/\s+/).includes('featured')).length;
const moreButton = document.getElementById('project-view-more');
const projectCount = document.getElementById('project-count');
let currentFilter = 'featured';

function applyProjectFilter(selected) {
  currentFilter = selected;
  let visible = 0;
  projects.forEach(card => {
    const categories = (card.dataset.categories || '').split(/\s+/);
    const show = selected === 'all' || categories.includes(selected);
    card.hidden = !show;
    if (show) visible++;
  });
  filters.forEach(button => {
    const active = button.dataset.filter === selected;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  if (projectCount) {
    projectCount.textContent = selected === 'featured'
      ? 'Showing ' + featuredTotal + ' featured projects of ' + projectTotal
      : selected === 'all'
        ? 'Showing all ' + projectTotal + ' projects'
        : 'Showing ' + visible + ' ' + selected + ' project' + (visible === 1 ? '' : 's');
    projectCount.hidden = false;
  }
  if (moreButton) {
    moreButton.hidden = !(selected === 'featured' || selected === 'all');
    moreButton.innerHTML = selected === 'featured'
      ? 'View all ' + projectTotal + ' projects <span aria-hidden="true">↓</span>'
      : 'Show ' + featuredTotal + ' featured projects <span aria-hidden="true">↑</span>';
    moreButton.setAttribute('aria-expanded', String(selected === 'all'));
  }
}
if (projects.length && filters.length) {
  filters.forEach(button => button.addEventListener('click', () => applyProjectFilter(button.dataset.filter)));
  if (moreButton) {
    moreButton.addEventListener('click', () => applyProjectFilter(currentFilter === 'featured' ? 'all' : 'featured'));
  }
  applyProjectFilter('featured');
}

const year = document.getElementById('year');
if (year) year.textContent = String(new Date().getFullYear());
