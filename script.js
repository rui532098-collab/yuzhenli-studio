(function () {
  const app = document.getElementById("app");
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxError = document.getElementById("lightbox-error");
  const lightboxClose = document.getElementById("lightbox-close");

  function encodeSrc(path) {
    return encodeURI(path);
  }

  function workById(id) {
    return ARCHIVE.works.find(function (item) {
      return item.id === id;
    });
  }

  function workIndex(id) {
    return ARCHIVE.works.findIndex(function (item) {
      return item.id === id;
    });
  }

  function parseRoute() {
    const hash = window.location.hash.replace(/^#/, "");
    const match = hash.match(/^work\/(.+)$/);
    if (match) {
      return { name: "work", id: decodeURIComponent(match[1]) };
    }
    return { name: "home" };
  }

  function bindImgError(img) {
    img.addEventListener("error", function () {
      const note = document.createElement("p");
      note.className = "img-fallback";
      note.textContent = "图片加载失败";
      img.replaceWith(note);
    });
  }

  function zoomable(src, alt) {
    const img = document.createElement("img");
    img.src = encodeSrc(src);
    img.alt = alt;
    bindImgError(img);
    img.addEventListener("click", function () {
      openLightbox(src, alt);
    });
    return img;
  }

  function renderHome() {
    document.body.className = "is-home";
    const works = ARCHIVE.works;

    const hotspots = works
      .filter(function (work) {
        return work.map && work.map.status === "confirmed";
      })
      .map(function (work) {
        return (
          '<button type="button" class="hotspot" data-id="' +
          work.id +
          '" style="left:' +
          work.map.x +
          "%;top:" +
          work.map.y +
          '%" aria-label="' +
          work.number +
          " " +
          work.name +
          '"></button>'
        );
      })
      .join("");

    const index = works
      .map(function (work) {
        return (
          '<li><a href="#work/' +
          work.id +
          '" data-id="' +
          work.id +
          '">' +
          work.number +
          " " +
          work.name +
          "</a></li>"
        );
      })
      .join("");

    app.innerHTML =
      '<div class="home">' +
      '<header class="topbar"><h1 class="site-title">' +
      ARCHIVE.siteTitle +
      "</h1></header>" +
      '<div class="stage">' +
      '<div class="map-frame">' +
      '<img src="' +
      encodeSrc(ARCHIVE.panorama.src) +
      '" alt="' +
      ARCHIVE.siteTitle +
      '" width="' +
      ARCHIVE.panorama.width +
      '" height="' +
      ARCHIVE.panorama.height +
      '">' +
      hotspots +
      "</div></div>" +
      '<ul class="work-index">' +
      index +
      "</ul></div>";

    const panoramaImg = app.querySelector(".map-frame img");
    bindImgError(panoramaImg);

    app.querySelectorAll(".hotspot").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.location.hash = "work/" + btn.getAttribute("data-id");
      });
      btn.addEventListener("mouseenter", function () {
        setIndexActive(btn.getAttribute("data-id"));
      });
      btn.addEventListener("mouseleave", function () {
        setIndexActive(null);
      });
      btn.addEventListener("focus", function () {
        setIndexActive(btn.getAttribute("data-id"));
      });
      btn.addEventListener("blur", function () {
        setIndexActive(null);
      });
    });
  }

  function setIndexActive(id) {
    app.querySelectorAll(".work-index a").forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("data-id") === id);
    });
  }

  function textBlock(label, value) {
    if (!value) return "";
    return "<p><strong>" + label + "</strong> " + value + "</p>";
  }

  function renderWork(id) {
    const work = workById(id);
    if (!work) {
      window.location.hash = "";
      return;
    }

    document.body.className = "is-detail";
    const index = workIndex(id);
    const prev = ARCHIVE.works[(index - 1 + ARCHIVE.works.length) % ARCHIVE.works.length];
    const next = ARCHIVE.works[(index + 1) % ARCHIVE.works.length];

    const meta =
      textBlock("介绍", work.intro) +
      textBlock("材料", work.materials) +
      textBlock("尺寸", work.dimensions) +
      textBlock("创作时间", work.year) +
      textBlock("资料来源", work.source);

    let compare = "";
    if (work.photo) {
      compare += "<figure data-slot=\"photo\"><figcaption>实物</figcaption></figure>";
    }
    if (work.manuscripts && work.manuscripts.length) {
      compare += "<figure data-slot=\"manuscript\"><figcaption>手稿</figcaption></figure>";
    }

    app.innerHTML =
      '<header class="detail-bar">' +
      '<nav class="nav-links"><a href="#">返回首页</a></nav>' +
      '<nav class="nav-links">' +
      '<a href="#work/' +
      prev.id +
      '">上一件</a>' +
      '<a href="#work/' +
      next.id +
      '">下一件</a>' +
      "</nav></header>" +
      '<article class="detail">' +
      '<div class="detail-head">' +
      '<p class="detail-number">' +
      work.number +
      "</p>" +
      '<h1 class="detail-name">' +
      work.name +
      "</h1></div>" +
      (compare ? '<section class="compare">' + compare + "</section>" : "") +
      (meta ? '<div class="meta">' + meta + "</div>" : "") +
      "</article>";

    const photoSlot = app.querySelector('[data-slot="photo"]');
    if (photoSlot) {
      photoSlot.appendChild(zoomable(work.photo, work.name));
    }

    const manuscriptSlot = app.querySelector('[data-slot="manuscript"]');
    if (manuscriptSlot) {
      manuscriptSlot.appendChild(zoomable(work.manuscripts[0], work.name + " 手稿"));
    }
  }

  function openLightbox(src, alt) {
    lightboxError.hidden = true;
    lightboxImage.hidden = false;
    lightboxImage.alt = alt || "";
    lightboxImage.src = encodeSrc(src);
    lightbox.hidden = false;
    lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImage.removeAttribute("src");
  }

  lightboxImage.addEventListener("error", function () {
    if (!lightbox.hidden) {
      lightboxImage.hidden = true;
      lightboxError.hidden = false;
    }
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !lightbox.hidden) {
      closeLightbox();
    }
  });

  function render() {
    closeLightbox();
    const route = parseRoute();
    if (route.name === "work") {
      renderWork(route.id);
    } else {
      renderHome();
    }
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", render);
  render();
})();
