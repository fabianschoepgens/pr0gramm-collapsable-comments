// ==UserScript==
// @name         Pr0gramm Collapsable Comments
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Klappe Kommentarverläufe auf und zu
// @author       s1ghn
// @match        https://pr0gramm.com/*
// @icon         https://pr0gramm.com/media/pr0gramm-favicon.png
// @sandbox DOM
// ==/UserScript==

function debounce(func, timeout = 300) {
   let timer;
   return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => { func.apply(this, args); }, timeout);
   };
}

(() => {
   'use strict';

   const blockId = '.comment-box-inner'
      , containerId = '.comment-box'
      , commentId = '.comment'
      , themeColor = '#ee4d2e'
      , collapserClass = 'comment-collapser'
      , collapserInnerClass = 'comment-collapser-inner'
      , collapsedClass = 'is-collapsed'
      , collapseProgressClass = 'is-expanding';

   let timeout;

   // insert styles
   const $styles = document.createElement('style');

   $styles.appendChild(document.createTextNode(`
      ${blockId} {
         overflow: hidden;
         transition: height .3s ease;
      }

      ${blockId}:not(.${collapseProgressClass}):not(.${collapsedClass}) {
         height: auto!important;
      }

      ${blockId}.${collapsedClass} > ${containerId} > ${blockId}:first-child ${commentId}:after {
         content: '';
         text-align: center;
         display: block;
         width: 100%;
         max-width: 532px;
         height: 16px;
         opacity: .5;
         font-size: 16px;
         line-height: 1;
      }

      ${blockId}.${collapsedClass}:not(.${collapseProgressClass}) > ${containerId} > ${blockId}:first-child ${commentId}:after {
         content: '...';
      }

      ${containerId} {
         position: relative;
      }

      .${collapserClass} {
         position: absolute;
         left: -12px;
         top: 0;
         width: 24px;
         height: 100%;
         cursor: pointer;
      }

      .${collapserInnerClass} {
         height: 100%;
         margin: 0 11.5px;
         border: 1px solid transparent;
         transform: scaleY(0);
         transition: transform .3s ease
            , border-color .01s ease-out;
      }

      .${collapserClass}:hover .${collapserInnerClass} {
         border-color: ${themeColor};
         transform: scaleY(1);
      }
   `));

   document.head.appendChild($styles);

   // initial load
   // TODO: Find proper way to insert the script
   const tt = window.setInterval(() => {
      const $blocks = document.querySelectorAll(blockId);
      if (!$blocks.length) return;

      window.clearInterval(tt);
      main();
   }, 1000);

   const main = () => {
      const $blocks = document.querySelectorAll(blockId);

      $blocks.forEach(($el) => {
         const $cb = $el.querySelector(containerId);

         // does not require collapsable when no comments
         if (!$cb) return;

         const commentHeight = $el.querySelector(commentId).clientHeight
            , firstChildCommentHeight = $cb.querySelector(blockId).querySelector(commentId).clientHeight;

         let expanded = true
            , originalHeight = $el.clientHeight;

         const $clickable = document.createElement('div');
         const $clickableStripe = document.createElement('div');
         $clickable.appendChild($clickableStripe);

         // set height to allow transition
         $el.style.height = originalHeight + 'px';

         // clickable attributes
         $clickable.classList.add([ collapserClass ]);
         $clickableStripe.classList.add([ collapserInnerClass ]);

         // click: expand or collapse
         $clickable.addEventListener('click', () => {
            expanded = !expanded;

            // update OG height when not collapsed
            if (!expanded) originalHeight = $el.clientHeight;

            $el.classList.add([ collapseProgressClass ]);

            // add class slightly later
            window.setTimeout(() => $el.style.height = expanded ? originalHeight + 'px' : (commentHeight + firstChildCommentHeight + 32 + 'px'), 10);

            if (!expanded) $el.classList.add([ collapsedClass ]);
            else $el.classList.remove([ collapsedClass ]);

            // set timer based transition classes
            window.clearTimeout(timeout);
            window.setTimeout(() => {
               $el.classList.remove([ collapseProgressClass ]);
            }, 310);
         });

         // insert clickable
         $cb.append($clickable);
      });
   };

   // navigating: either via historyState or pr0gramm controller
   // controller: extend base
   const oldNavigationCode = p.navigateTo.toString();
   p.navigateTo = (...a) => {
      eval(`(${oldNavigationCode}.bind(p))(${a.map(b => JSON.stringify(b)).join(',')})`);
      main();
   };
   p.navigateTo.bind(p);

   // history: via popstate event
   window.addEventListener('popstate', main);

   // resizing must redo the script as well
   window.addEventListener('resize', debounce(main, 300));
})();