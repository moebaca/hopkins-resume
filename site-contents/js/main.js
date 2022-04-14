(function () {
  const isLocal =
    window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isLocal) {
    console.log('Running in local environment');
  } else {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach((link) => {
      if (link.href.includes('./')) {
        link.href = link.href.replace('./', '/');
      }
    });

    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      if (img.src.includes('./')) {
        img.src = img.src.replace('./', '/');
      }
    });

    const scripts = document.querySelectorAll('script');
    scripts.forEach((script) => {
      if (script.src && script.src.includes('./')) {
        script.src = script.src.replace('./', '/');
      }
    });

    console.log('Running in production environment, paths updated');
  }
})();

jQuery(document).ready(function ($) {
  // Example existing animation code
  $('.level-bar-inner').css('width', '0');
  $(window).on('load', function () {
    $('.level-bar-inner').each(function () {
      var itemWidth = $(this).data('level');
      $(this).animate(
        {
          width: itemWidth,
        },
        800
      );
    });
  });

  // Dynamic year
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
