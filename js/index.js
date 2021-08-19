let wgI;
let lang = "en_EN";
let userParams = {};

function changeLang(lang)
{
    localStorage.setItem('lang',lang);

    // remove lang param from hash
    let hash = document.location.hash.substr(1).split('&');
    let urlParams = {}, newHash = [];
    for(let i = 0; i < hash.length; i++)
    {
        let p = hash[i].split('=');
        if(p[0] == '') continue;
        urlParams[p[0]] = p[1];
    }
    if(urlParams['lang']){
        delete urlParams['lang'];
    }
    for(param in urlParams) {
        newHash.push(param + "=" + urlParams[param]);
    }
    document.location.hash = "#" + newHash.join('&');
    document.location.reload();
    return false;
}

let initFn = (function()
{
    // getting user params
    if(window.localStorage && localStorage.getItem('settings')) {
        userParams = JSON.parse(localStorage.getItem('settings'));
    }

    // lang selection
    let hash = document.location.hash.substr(1).split('&');
    let urlParams = {};
    for(let i = 0; i < hash.length; i++)
    {
        let p = hash[i].split('=');
        urlParams[p[0]] = p[1];
    }

    if(urlParams['lang'] === "fr_FR" || urlParams['lang'] === 'fr') {
        lang = "fr_FR";
        localStorage.setItem('lang','fr_FR');
    } else {
        if(localStorage.getItem('lang')){
            lang = localStorage.getItem('lang');
        }
    }

    if(lang == "fr_FR"){
        $('.lang-en').remove();
    } else {
        $('.lang-fr').remove();
    }

    /* init page */
    jQuery.getJSON('content/wgI.json?v6.json', function(r){
        const nb_chap = r.SPM.chapters.length;
        wgI = r;
        
        let lev1 = '';
        for(let c = 0; c < nb_chap; c++)
        {
            let chap = r.SPM.chapters[c];
            let chaptitle = chap[lang] || chap.en_EN;
            lev1 += /*html*/`
            <div class="col s12 m6 l3">
                <a href="#" data-chapter="${chap.ref}" onclick="return switchChapter(this);" class="href-card"><div class="hoverable card blue-grey darken-1">
                    <span class="chapter-ref">${chap.ref}</span>
                    <div class="card-content white-text">
                        <span class="card-title">${chaptitle}</span>
                    </div>
                </div>
            </div>`;
        }

        jQuery('#SPM-chapters-level1').html(lev1);
        populateToC();

        // populating FAQ
        let faq = '';
        const order = ["1","2","3","4","5","6","7","8","9","10","11","12"];
        for(let i = 0; i < order.length; i++)
        {
            let chaps = wgI[order[i]].chapters;
            faq += '</div><div class="row">';
            for(let j = 0; j < chaps.length; j++)
            {
                if(chaps[j].ref.startsWith("FAQ"))
                {
                    let chaptitle = chaps[j][lang] || chaps[j].en_EN;
                    let read = (userParams['read'] && userParams['read'][chaps[j].ref])
                                    ? ' style="display:block" '
                                    : '';
                    
                    faq += /*html*/`<div class="col s12 m6 l3">
                    
                        <a href="#" onclick="return dispFAQ(this);" data-cite="${chaps[j].ref}">
                            <div class="hoverable faq-card card green lighten-5">
                                <span class="chapter-ref" style="color:black; transform: translateY(-8px)">${chaps[j].ref}</span>
                                <span data-readmarker="${chaps[j].ref}" class="chapter-read" title="You have read this part" ${read}><i class="material-icons">done_all</i></span>
                                <div class="card-content" style="color:black">
                                    <p>${chaptitle}</p>
                                </div>
                            </div>
                        </a>

                    </div>`;
                }
            }
        }
        $('#FAQ-chapters-level1').html(faq);


        // init from hash url
        if(urlParams['chapter'] && urlParams['chapter'].length)
        {
            let chap = urlParams['chapter'].split('.');
            if(chap[0] === 'SPM') {
                switchChapter(
                    $('#SPM-chapters-level1 [data-chapter=\''+chap[1]+'\']')
                );
            }
        }

        if(urlParams['faq'] && urlParams['faq'].length)
        {
            dispFAQ(
                $('#FAQ-chapters-level1 [data-cite=\''+urlParams['faq']+'\']')
            );
        }

        if(urlParams['fig'] && urlParams['fig'].length)
        {
            dispFig(
                $('<div data-figref="'+urlParams['fig']+'"></div>')
            );
        }

        if(urlParams['box'] && urlParams['box'].length)
        {
            let element = findSourceByRef(decodeURI(urlParams['box']));
            displayBox(element.elm);
        }

        if(urlParams['opened'] && urlParams['opened'].length)
        {
            dispSource($('<div data-cite="'+urlParams['opened']+'"></div>'));
        }
    });

    // menu dropdown
    let elems = document.querySelectorAll('.dropdown-trigger');
    let instances = M.Dropdown.init(elems, {
        constrainWidth: false
    });

})();

/* history and localStorage */
function saveLocalStorage()
{
    localStorage.setItem('settings', JSON.stringify(userParams));
}

function markAsRead(e, tag = 'data-cite')
{
    let ref = $(e).attr(tag);

    if(typeof userParams['read'] === 'undefined')
    {
        userParams['read'] = {};
    }

    userParams['read'][ref] = new Date().getTime();
    $('.chapter-read[data-readmarker=\''+ref+'\']').css('display','inline-block');

    saveLocalStorage();

    return false;
}

/* affichage d'une FAQ */
let currentFAQ = false;
function dispFAQ(e)
{
    let ref = $(e).attr('data-cite');
    let faq = findSourceByRef(ref);

    if(faq) {
        faq = faq.elm;
        if(faq.intro || faq.paragraphs){
            // affichage en popup
            let faqtitle = faq[lang] || faq.en_EN;
            let faqintro  = faq.intro[lang] || faq.intro.en_EN;
            let faqtext   = faq.paragraphs[lang] || faq.paragraphs.en_EN;
            let html = /*html*/`<h4>${faq.ref}: ${faqtitle}</h4>`;

            if(faqintro) {
                html += `<p class="faq-intro">${faqintro}</p>`;
            }

            // figures in FAQ
            if(faq.figref)
            {
                for(let i = 0; i < faq.figref.length; i++)
                {
                    html += `<img style="max-width:100%" src="content/img/en_EN/${faq.figref[i]}.png">`;
                }
            }

            // paragraphs in FAQ
            for(let i = 0; i < faqtext.length; i++)
            {
                html += `<p>${faqtext[i]}</p>`;
            }

            $('#modal-faq .modal-content').html(html);
            $('#modal-faq .faq-reflink').attr('data-cite', ref);
            let mod = M.Modal.init(document.getElementById('modal-faq'), {
                endingTop: '4%',
                onCloseStart: function(){
                    currentFAQ = false;
                    updateHash();
                }
            });
            mod.open();
            currentFAQ = ref;
            updateHash();
            $('#modal-faq .faq-sharelink').attr('href', document.location.href);
            
        } else {
            // affichage dans le PDF (fallback)
            dispSource(e);
        }
    }

    return false;
}

/* remplit le sommaire */
let TOC_Modal, sidenav_inst;
function populateToC()
{
    let html = '';
    const order = [/*"SPM",*/"TS","1","2","3","4","5","6","7","8","9","10","11","12","Atlas"];
    for(let i = 0; i < order.length; i++)
    {
        html += constructSubMenu(wgI[ order[i] ], 0);
    }

    // link to full ToC
    html += /*html*/`
        <li>
            <a class="btn btn-small" href="#" onclick="return displayFullToc();">View full table of contents</a>
        </li>
    `;
    $('#slide-out').html(html);

    var elems = document.querySelectorAll('.collapsible');
    var instances = M.Collapsible.init(elems);
    updateTooltips();

    // load sidenav handler
    let sidenav_elm = document.querySelectorAll('.sidenav');
    sidenav_inst = M.Sidenav.init(sidenav_elm, {});

    // FULL table of contents in popup:
    html = '';
    for(let i = 0; i < order.length; i++)
    {
        html += recursiveTOC(wgI[ order[i] ], 0);
    }
    $('#modal-toc .modal-content').html("<ul class='toc-holder'>"+html+"</ul>");
    TOC_Modal = M.Modal.init(document.getElementById('modal-toc'), {
        endingTop:'4%'
    });
}

function displayFullToc()
{
    TOC_Modal.open();
    return false;
}

function recursiveTOC(chapter, recnum)
{
    if(recnum > 5) return '';

    let chaptitle = chapter[lang] || chapter.en_EN;

    let spage = '';
    if(chapter.startPage)
    {
        let ref = chapter.ref
            .replace('FAQ','')
            .split('.'),
            page = chapter.startPage;
        if(ref.length > 1 && ref[0] >= 1 && ref[0] <= 12) {
            // sous chapitre : incrémenter le n° de page :
            page = chapter.startPage + wgI[ref[0]].offsetPagesFromFull;
        }
        spage = `<span class="toc-page">${page}</span>`;
    }

    if(chapter.chapters)
    {
        // has child
        let sub_c = '';
        for(let i = 0; i < chapter.chapters.length; i++)
        {
            sub_c += recursiveTOC(chapter.chapters[i], recnum+1);
        }

        return /*html*/`<li>
            <a href="#" class="modal-close" onclick="return dispSource(this);" data-cite="${chapter.ref}">
                <span class="toc-chaptitle">${chapter.ref}</span>
                ${chaptitle}${spage}
            </a>
            <ul>
                ${sub_c}
            </ul>
        </li>`;
    }
    else
    {
        // leaf
        return /*html*/`<li data-ref="${chapter.ref}">
                <a href="#" class="modal-close" onclick="return dispSource(this);" data-cite="${chapter.ref}">
                    <span class="toc-chaptitle">${chapter.ref}</span>
                    ${chaptitle}${spage}
                </a>
            </li>`;
    }
    
}

function constructSubMenu(chapter, recnum)
{
    if(recnum > 1) return '';

    let html = '';
    if(chapter.chapters && chapter.chapters.length)
    {
        // has child
        let chaptitle = chapter[lang] || chapter.en_EN;
        html += /*html*/`<li class="no-padding">
            <ul class="collapsible collapsible-accordion">
                <li style="position:relative">
                    <a class="collapsible-header"><i class="material-icons">arrow_drop_down</i>${chapter.ref}. ${chaptitle}</a>
                    <a href="#" onclick="return dispSource(this)" data-cite="${chapter.ref}" style="position:absolute; right:0px; top:0; padding:0 5px; width:30px; text-align:center; display:inline-block" data-tippy-content="Read this chapter"><i class="material-icons" style="font-size:0.8em; margin:0; width:20px">open_in_new</i></a>
                    <div class="collapsible-body">
                        <ul>
                `;
        for(let k = 0; k < chapter.chapters.length; k++)
        {
            // TODO escape quotes
            // TODO remove FAQ and maybe crosschapter to put them somewhere else?
            let chaptitle = chapter.chapters[k][lang] || chapter.chapters[k].en_EN;
            let n = chapter.chapters[k].ref + ". " + chaptitle;

            let dispRead = '';
            if(userParams['read'] && userParams['read'][ chapter.chapters[k].ref ]) {
                dispRead = `<i data-tippy-content="Already read" class="right material-icons green-text">done_all</i>`;
            }

            html += /*html*/`<li>
                <a href="#" data-cite="${chapter.chapters[k].ref}" onclick="return dispSource(this);" data-tippy-content="${n}">
                    <span class="toc-ref">${chapter.chapters[k].ref}</span>
                    ${chaptitle}
                    ${dispRead}
                </a>
            </li>`;
        }
        html += `</ul></div></li></ul></li>`;
    }
    return html;
}

function updateHash()
{
    let hash = "lang="+lang;
    if(currentChapter !== false) {
        hash += "&chapter=SPM."+currentChapter;
    }
    if(currentFAQ !== false) {
        hash += "&faq="+currentFAQ;
    }
    if(pdfCurrentPage !== false) {
        hash += "&reportpage="+pdfCurrentPage;
    }
    if(currentFig !== false) {
        hash += "&fig="+currentFig;
    }
    if(currentBox !== false) {
        hash += "&box="+currentBox;
    }
    if(currentlyLoadedPanel !== false) {
        hash += "&opened="+currentlyLoadedPanel;
    }

    document.location.hash = hash;
}

function displaySubLevel(e)
{
    $(e).next('.chaplev3-holder').css('display','block');    
    return false;
}

/* change chap niv1 */
let currentChapter = false;
function switchChapter(e)
{
    let chapter = $(e).attr('data-chapter');
    if(chapter === currentChapter)
    {
        // close current chapter
        $('#SPM-chapters-level2').html('');
        $('#SPM-follow-line').css('display','none');
        currentChapter = false;
        updateHash();
        return false;
    }
    
    currentChapter = chapter;

    // display correct chapters
    let html = ``;
    for(let i = 0; i < wgI.SPM.chapters.length; i++)
    {
        if(wgI.SPM.chapters[i].ref != chapter) continue;
        let chap = wgI.SPM.chapters[i];

        for(let j = 0; j < chap.chapters.length; j++)
        {
            let chp = chap.chapters[j];
            if(chp.ref.substr(0,3) == "Box") continue;

            let srcs = '';
            // citations du chapitre
            for(let k = 0; k < chp.cites.length; k++)
            {
                let src = chp.cites[k];
                srcs += /*html*/`<a href="#" class="src1" data-cite="${src}" onmouseover="return hoverSource(this);" onmouseout="return mouseoutSource(this)" onclick="return dispSource(this)">${src}</a>`;
            }

            // ajout des figures référencées
            let figures = '';
            if(chp.figures && chp.figures.length)
            {
                figures += '<div class="figure-level2-holder">';
                for(let k = 0; k < chp.figures.length; k++)
                {
                    let figref = chp.figures[k];
                    figures += /*html*/`
                    <a href="#" data-figref="${figref}" onclick="return dispFig(this);">
                        <div class="figure-level2">
                            <img src="content/img/en_EN/${figref}.png">
                            <span class="fig-name"></span>
                        </div>
                    </a>
                    `;
                }
                figures += '</div>';
            }

            let chapdesc = chp[lang] || chp.en_EN;
            html += /*html*/`
            <div class="card-panel chaplev2 hoverable" onclick="return displaySubLevel(this);">
                <span class="chap-ref">${chp.ref}</span>
                <p>${chapdesc}</p>
                ${figures}
                <div class="chap-sources">
                    See also : ${srcs}
                </div>
                <span class="badge ref-page">page ${chp.startPage}-${chp.endPage}</span>
            </div>
            `;

            // sous-chapitres (niv3)
            if(chp.chapters && chp.chapters.length)
            {
                html += /*html*/`<div class="chaplev3-holder">`;
                for(let k = 0; k < chp.chapters.length; k++)
                {
                    let subchap = chp.chapters[k];
                    let chaptext = subchap[lang] || subchap.en_EN;
                    let txt = processText(chaptext);

                    // références ?
                    let refs = '';
                    if(subchap.cites && subchap.cites.length)
                    {
                        refs = 'See: ';
                        for(let n = 0; n < subchap.cites.length; n++)
                        {
                            refs += /*html*/`<a href="#" class="src1" data-cite="${subchap.cites[n]}" onmouseover="return hoverSource(this);" onmouseout="return mouseoutSource(this)" onclick="return dispSource(this)">${subchap.cites[n]}</a>`;
                        }
                    }
                    if(subchap.figref && subchap.figref.length)
                    {
                        for(let n = 0; n < subchap.figref.length; n++)
                        {
                            refs += /*html*/`<a href="#" class="src1" data-figref="${subchap.figref[n]}" onclick="return dispFig(this)">Figure ${subchap.figref[n]}</a>`;
                        }
                    }


                    html += /*html*/`<div class="card-panel chaplev3">
                        <span class="chap-ref">${subchap.ref}</span>
                        <p>${txt}</p>
                        ${refs}
                    </div>`;
                }
                html += /*html*/`</div>`;
            }
        }

        $('#SPM-chapters-level2').html(html);
        updateHash();
        updateTooltips();

        break;
    }

    // ligne décorative
    $('#SPM-follow-line').css({
        display: 'block',
        top: $(e).position().top,
        left: $(e).position().left + 20,
        height: $('#SPM-chapters-level2').position().top
                    - $(e).position().top
                    + $('#SPM-chapters-level2').height()
    });

    return false;
}

/* retrigger tooltips */
function updateTooltips()
{
    tippy('[data-tippy-content]', {
        allowHTML: true
    });
}

/* affichage pdf initial */
let pdfAskedForLoad = false, pdfLoadInProgress = false, pdfGoToPage = false;
function post_pdfLoad()
{
    pdfLoadInProgress = true;
    document.getElementById('pdf-iframe').contentWindow.PDFViewerApplication.initialBookmark = "page="+pdfGoToPage;
    document.getElementById('pdf-iframe').contentWindow.PDFViewerApplication.open("../../../pdf/noIMG.pdf");

    // adding end of loading callback:
    document.getElementById('pdf-iframe').contentWindow.PDFViewerApplication.eventBus.on('pagerendered', function(e){
        if(pdfGoToPage) {
            pdfGoToPage = false;
        }
        pdfLoadInProgress = false;
    });

    return false;
}

function openLocalPdf()
{
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';

    input.onchange = function(e){
        if(e && e.target && e.target.files.length)
        {
            let file = e.target.files[0];
            let x = document.getElementById('pdf-iframe').contentWindow;
            let PDFViewerApplication = x.PDFViewerApplication;
            PDFViewerApplication.eventBus.dispatch("fileinputchange", {
                source: x,
                fileInput: e.target
            });

            // adding end of loading callback:
            document.getElementById('pdf-iframe').contentWindow.PDFViewerApplication.eventBus.on('pagerendered', function(e){
                if(pdfGoToPage) {
                    var askedPageChange = pdfGoToPage;
                    setTimeout(function(){
                        pdfChangePage(askedPageChange);
                    }, 500);
                    pdfGoToPage = false;
                }
                pdfLoadInProgress = false;
            });
        }
    };

    input.click();
}

function pdfLoad()
{
    // display modal first
    let mod = M.Modal.init(document.getElementById('modal-beforedownload'), {});
    mod.open();

    return false;
}

function togglePdfPanel()
{
    if($('#side-panel-pdf').css('visibility')=='hidden')
    {
        $('#side-panel-pdf').css('visibility',"visible");
    }
    else
    {
        closePdfPanel();
    }

    return false;
}

function closePdfPanel()
{
    $('#side-panel-pdf').css('visibility','hidden');
    pdfCurrentPage = false;
    updateHash();
}

let pdfCurrentPage = false;
function pdfChangePage(page)
{
    console.log("asking for page change",page);
    pdfCurrentPage = page;
    updateHash();

    // TODO split in multiple small pdf files
    if(!pdfAskedForLoad && !pdfLoadInProgress){
        console.log("Asking for a PDF load");
        pdfLoad();
        pdfAskedForLoad = true;
        pdfGoToPage = page;
        return false;
    }

    let x = document.getElementById('pdf-iframe').contentWindow;
    x.PDFViewerApplication.page = page;
    x.PDFViewerApplication.pdfViewer._currentPageNumber = page;
    x.PDFViewerApplication.pdfViewer.update();

}

/* mouse over/out a source : display brief information about it */
function hoverSource(e)
{
    let src = $(e).attr('data-cite');
    let findSrc = findSourceByRef(src);

    // reference has been found in detailed text
    if(findSrc)
    {
        // has already been read?
        findSrc = findSrc.elm;
        let read = (userParams['read'] && userParams['read'][findSrc.ref]) ? `<br><i class="green-text material-icons">done_all</i> already read` : '';
        tippy(e, {
            content: "<span class='tooltip-ref-chapter'>" + findSrc.ref + ". " + findSrc.en_EN + "</span>" + getChildChapters(findSrc)
                + read + "<br><i>click to go to this section</i>",
            allowHTML: true
        });
    }
}

function getChildChapters(element)
{
    if(!element.chapters || !element.chapters.length)
    {
        return '';
    }

    let html = '<ul class="tooltip-ref-subchapters">';
    for(let i = 0; i < element.chapters.length; i++)
    {
        html += /*html*/`<li>${element.chapters[i].ref}. ${element.chapters[i].en_EN}</li>`;
    }
    return html + '</ul>';
}

function mouseoutSource(e)
{
    return;
}

/* go to source */
function dispSource(e)
{
    let src = $(e).attr('data-cite');
    let element;

    // close sidenav if on mobile
    if(window.innerWidth < 992 && sidenav_inst[0].isOpen) {
        sidenav_inst[0].close();
    }

    if(src.substr(0,2) == 'TS') {
        // part of the TS
        loadMainPanel('TS', src);
        return false;
    }
    if(src.substr(0,2) == '1.') {
        // chapter 1 available
        loadMainPanel('1', src);
        return false;
    }

    // finding it in full text :
    console.log("searching ref in full text");
    element = findSourceByRef(src);
    if(!element || !element.elm.startPage){
        alert('An error has occured');
        console.log("could not find ref", src, element);
        return false;
    }

    let pageOffset = element.offset;
    element = element.elm;

    // chapitre principal
    if(element.offsetPagesFromFull)
    {
        refpage = element.offsetPagesFromFull;
    }
    else
    {
        // sous-partie avec un offset
        refpage = element.startPage + pageOffset;
    }

    if(element && element.hasFile)
    {
        // the element has been converted to html, display it as a popup :
        displayBox(element);
        return false;
    }

    if($('#side-panel-pdf').css('visibility')=='visible')
    {
        // déjà affiché, on change juste de page
    }
    else
    {
        $('#side-panel-pdf').css('visibility','visible');
    }

    pdfChangePage(refpage);

    return false;
}

let currentBox = false;
function displayBox(element)
{
    let title = element[lang] || element.en_EN;
    currentBox = element.ref;

    $.get('pdf/html/' + element.ref + '.html', function(html){
        html = processText(html);
        updateHash();

        $('#modal-box .modal-content').html(`<h4>${element.ref}: ${title}</h4>${html}`);
        $('#modal-box .box-sharelink').attr('href', document.location.href);
        $('#modal-box .box-reflink').attr('data-cite', element.ref);
        let mod = M.Modal.init(document.getElementById('modal-box'), {
            endingTop: '4%',
            onCloseStart: function(){
                currentBox = false;
                updateHash();
            }
        });
        mod.open();
        updateTooltips();

    }).fail(function(){
        // fallback to PDF
        dispSource($('<span data-cite="'+element.ref+'"></span>'));
    });
}

function displayBoxByRef(elm)
{
    let ref = $(elm).attr('data-boxref');
    let element = findSourceByRef(ref);
    if(element && element.elm) {
        displayBox(element.elm);
    }

    return false;
}

/* find source by ref */
const regular_chapter_match = /^[0-9es.]+$/g;
const TS_chapter_match = /^TS\.[0-9.]+$/g;
const Atlas_chapter_match = /^Atlas\.[0-9.]+$/g;
const CCBox_chapter_match = /^Cross-Chapter Box [0-9.]+$/g;
const CSBox_chapter_match = /^Cross-Section Box TS\.[0-9.]+$/g;
const BoxTS_chapter_match = /^Box TS\.[0-9.]+$/g;
const Box_chapter_match = /^Box [0-9.]+$/g;
const BoxSPM_chapter_match = /^Box SPM\.[0-9.]+$/g;
function findSourceByRef(src)
{
    let matched = false;

    // FAQ chapters (FAQ3.4)
    if(src.substr(0,3) == "FAQ"){
        let path = src.substr(3).split('.');
        if(wgI[ path[0] ]){
            matched = returnElementByRefName(wgI[ path[0] ], src);
        } else {
            console.log("error finding FAQ ref", src, path);
        }
    }
    // box TS
    else if(src.match(BoxTS_chapter_match)){
        let path = src.substr(7).split(".");
        matched = returnElementByRefName(wgI.TS, src);
    }
    // Cross-chapter box
    else if(src.match(CCBox_chapter_match)){
        let path = src.substr(18).split(".");
        if(wgI[ path[0] ]){
            matched = returnElementByRefName(wgI[ path[0] ], src);
        } else {
            console.log("error finding CC-Box ref", src, path);
        }
    }
    // box SPM
    else if(src.match(BoxSPM_chapter_match)){
        let path = src.substr(8).split(".");
        matched = returnElementByRefName(wgI.SPM, src);
    }
    // Cross-section box TS
    else if(src.match(CSBox_chapter_match)){
        let path = src.substr(21).split(".");
        matched = returnElementByRefName(wgI.TS, src);
    }
    // simple box
    else if(src.match(Box_chapter_match)){
        let path = src.substr(4).split(".");
        if(wgI[ path[0] ]){
            matched = returnElementByRefName(wgI[ path[0] ], src);
        } else {
            console.log("error finding Box ref", src, path);
        }
    }
    // regular chapters (1.1.1.1)
    else if(src.match(regular_chapter_match)) {
        let path = src.split('.');
        
        if(wgI[ path[0] ]){
            matched = returnElementByRefName(wgI[ path[0] ], src);
        } else {
            console.log("error finding ref", src, path);
        }
    }
    // Technical summary
    else if(src.match(TS_chapter_match)) {
        let path = src.split('.');
        
        matched = returnElementByRefName(wgI.TS, src);
    }
    // Atlas chapter
    else if(src.match(Atlas_chapter_match)) {
        let path = src.split('.');
        
        matched = returnElementByRefName(wgI.Atlas, src);
    }
    

    //console.info("FOUND", matched, src);
    return matched;
}

function returnElementByRefName(table, query, parentOffset = 0)
{
    //console.log("searching", table.ref, "for",query);
    if(table.ref == query) {
        console.log("early return");
        return {
            'elm': table,
            'offset':0
        };
    }

    if(table.chapters && table.chapters.length)
    {
        if(table.offsetPagesFromFull){
            parentOffset = table.offsetPagesFromFull;
        }

        for(let i = 0; i < table.chapters.length; i++)
        {
            //console.log("is match?", table.chapters[i].ref, query);
            if(table.chapters[i].ref === query) {
                return {
                    'offset': parentOffset,
                    'elm': table.chapters[i]
                };
            }

            // try subchapters
            let tr = returnElementByRefName(table.chapters[i], query, parentOffset);
            if(tr) {
                return tr;
            }
        }
    }

    return false;
}

const TS_chapter_repl = /(Cross-Section Box TS\.[0-9.]+)|(Cross-Chapter Box [0-9.]+)|(Cross-Chapter Box Atlas\.[0-9.]+)|(Box SPM\.[0-9.]+)|(Box TS\.[0-9.]+)|(Infographic TS\.[0-9]+)|(TS\.[0-9.]+)|(SPM\.[0-9.]+)|(FAQ\s?[0-9.]+)|(Box [0-9.]+)|([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)|([0-9]+\.[0-9]+\.[0-9]+)|(Atlas\.[0-9]+\.[0-9]+)|(Atlas\.[0-9]+)/g;
let regex_autoref_fn = function(orig, CSBTS, CCB, CCBA, BSPM, BTS, InfoTS, TS, SPM, FAQ, B, ABCD, ABC, AtlasAB, AtlasA, value, complete_string)
{
    let has_figref_tag = (complete_string.substr(value-8, 8) == '<figref>');
    let has_goto_tag   = (complete_string.substr(value-6, 6) == '<goto>');
    let has_boxref_tag   = (complete_string.substr(value-8, 8) == '<boxref>');
    if(has_figref_tag || has_goto_tag || has_boxref_tag) {
        return orig; // do nothing
    }
    
    if(orig.substr(0,4) === 'FAQ '){
        orig = orig.replace(' ', '');
        return /*html*/`<a href="#" onclick="return dispFAQ(this);" data-cite="${orig}" class="src1">${orig}</a>`;
    }

    return /*html*/`<a href="#" class="src1" data-cite="${orig}" onmouseover="return hoverSource(this);" onmouseout="return mouseoutSource(this)" onclick="return dispSource(this)">${orig}</a>`;
};

const markup_regex = /<(goto|figref|ref|boxref)>([A-Za-z0-9., -]+)<\/(goto|figref|ref|boxref)>/g;
let regex_markup_fn = function(orig1, balise, content, balise2, position)
{
    if(balise == 'goto')
    {
        return /*html*/`<a href="#" class="src1" data-cite="${content}" onmouseover="return hoverSource(this);" onmouseout="return mouseoutSource(this)" onclick="return dispSource(this)">${content}</a>`;
    }
    else if(balise == 'boxref')
    {
        let box = findSourceByRef(content).elm || {};
        let boxTitle = box[lang] || box.en_EN || "";
        let alreadyRead = userParams['read'] && userParams['read'][content]
            ? /*html*/`<span class="right green-text" data-tippy-content="You have already read this Box"><i class="material-icons">done_all</i></span>`
            : '';

        return /*html*/`<div onclick="return displayBoxByRef(this)" data-boxref="${content}" class="card-panel indigo darken-4 white-text hoverable" style="cursor:pointer; margin:0 30px;">
            Read ${content}: ${boxTitle}
            ${alreadyRead}
        </div>`;
    }
    else if(balise == 'ref')
    {
        let footnote = wgI.SPM.footnotes[content];
        if(!footnote)
            return /*html*/`<abbr class="footnote-ref" data-tippy-content="(reference not yet available, see PDF)"><sup>${content}</sup></abbr>`;

        return /*html*/`<abbr class="footnote-ref" data-tippy-content="${footnote}" data-ref="${content}"><sup>${content}</sup></abbr>`;
    }
    else if(balise == 'figref')
    {
        let fig = wgI.figures[content];
        let fig_title = '', fig_subtitle = '', fig_description = '';
        if(fig){
            fig_title = fig.title[lang] || fig.title.en_EN;
            fig_subtitle = fig.subtitle[lang] || fig.subtitle.en_EN;
            let fig_arr = fig.description[lang] || fig.description.en_EN;
            for(let i = 0; i < fig_arr.length; i++) {
                fig_description += `<p>${fig_arr[i]}</p>`;
            }
        }

        return /*html*/`<div class="center"><div class="small-figure hoverable" onclick="$(this).find('.fig-clicker').toggle(); $(this).find('.fig-legend-ext').toggle();">
            <img src="content/img/en_EN/${content}.png" onerror="console.error('failed to load image',this); $(this).parent().remove();">
            <span class="fig-legend">${content}: ${fig_title}</span><span class="fig-clicker"> (click to read the legend)</span>
            <div class="fig-legend-ext"><em>${fig_subtitle}</em>${fig_description}</div>
        </div></div>`;
    }
    else
    {
        return orig1;
    }
};

const conf_image = "<br><img src='content/img/en_EN/confidence.png' style='width:500px'>";
const confidence_regex = /\(?(_?high confidence|very high confidence|medium confidence|low confidence|very low confidence_?)\)?/g;
const conf_levels = {
    "high confidence":"high-confidence", "very high confidence":"very-high-confidence",
    "medium confidence":"medium-confidence", "low confidence":"low-confidence", "very low confidence":"very-low-confidence"
};
const symbollevels = {
    "high confidence":"+", "very high confidence":"↑",
    "medium confidence":"~", "low confidence":"-", "very low confidence":"↓"
};
let regex_confidence_fn = function(orig, value){
    let conf = conf_levels[value];
    let symb = symbollevels[value];
    if(orig[0] == '('){
        return /*html*/`<span class="${conf}" data-tippy-content="${conf_image}${value}">${symb}</span>`;
    } else {
        return /*html*/`<span class="${conf}-text" data-tippy-content="${conf_image}">${value}</span>`;
    }
};

function processText(txt)
{
    // confidence levels
    txt = txt.replaceAll(confidence_regex, regex_confidence_fn);

    // certainty level
    txt = txt.replaceAll("_virtually certain_", '<span class="virtually-certain-text" data-tippy-content="virtually certain = 99-100% probability">virtually certain</span>');
    txt = txt.replaceAll("_very likely_", '<span class="very-likely-text" data-tippy-content="very likely = 90-100% probability">very likely</span>');
    txt = txt.replaceAll("_likely_", '<span class="likely-text" data-tippy-content="likely = 66-100% probability">likely</span>');
    txt = txt.replaceAll("_about as likely as not_", '<span class="about-as-likely-as-not-text" data-tippy-content="about as likely as not = 33-66% probability">about as likely as not</span>');
    txt = txt.replaceAll("_unlikely_", '<span class="unlikely-text" data-tippy-content="unlikely = 0-33% probability">unlikely</span>');
    txt = txt.replaceAll("_very unlikely_", '<span class="very-unlikely-text" data-tippy-content="very unlikely = 0-10% probability">very unlikely</span>');
    txt = txt.replaceAll("_exceptionally unlikely_", '<span class="exceptionally-unlikely-text" data-tippy-content="exceptionally unlikely = 0-1% probability">_exceptionally unlikely</span>');
    txt = txt.replaceAll("_extremely likely_", '<span class="extremely-likely-text" data-tippy-content="extremely likely = 95-100% probability">extremely likely</span>');
    txt = txt.replaceAll("_more likely than not_", '<span class="more-likely-than-not-text" data-tippy-content="more likely than not = >50-100% probability">more likely than not</span>');
    txt = txt.replaceAll("_extremely unlikely_", '<span class="extremely-unlikely-text" data-tippy-content="extremely unlikely = 0-5% probability">extremely unlikely</span>');

    // confidence levels FR
    txt = txt.replaceAll("(_fiabilité forte_)", '<span class="high-confidence" data-tippy-content="fiabilité forte'+conf_image+'">+</span>');
    txt = txt.replaceAll("_fiabilité forte_", '<span class="high-confidence-text">fiabilité forte</span>');

    txt = txt.replaceAll("(_fiabilité très élevée_)", '<span class="very-high-confidence" data-tippy-content="fiabilité très élevée'+conf_image+'">+</span>');
    txt = txt.replaceAll("_fiabilité très élevée_", '<span class="very-high-confidence-text">fiabilité très élevée</span>');

    txt = txt.replaceAll("(_fiabilité moyenne_)", '<span class="medium-confidence" data-tippy-content="fiabilité moyenne'+conf_image+'">~</span>');
    txt = txt.replaceAll("_fiabilité moyenne_", '<span class="medium-confidence-text">fiabilité moyenne</span>');

    txt = txt.replaceAll("(_fiabilité faible_)", '<span class="low-confidence" data-tippy-content="fiabilité faible'+conf_image+'">-</span>');
    txt = txt.replaceAll("_fiabilité faible_", '<span class="low-confidence-text">fiabilité faible</span>');

    txt = txt.replaceAll("(_fiabilité très faible_)", '<span class="very-low-confidence" data-tippy-content="fiabilité très faible'+conf_image+'">-</span>');
    txt = txt.replaceAll("_fiabilité très faible_", '<span class="very-low-confidence-text">fiabilité très faible</span>');

    // certainty level FR
    txt = txt.replaceAll("_pratiquement certain_", '<span class="virtually-certain-text" data-tippy-content="pratiquement certain = 99-100% de probabilité">pratiquement certain</span>');
    txt = txt.replaceAll("_très probable_", '<span class="very-likely-text" data-tippy-content="très probable = 90-100% de probabilité">très probable</span>');
    txt = txt.replaceAll("_très probablement_", '<span class="very-likely-text" data-tippy-content="très probablement = 90-100% de probabilité">très probablement</span>');
    txt = txt.replaceAll("_probable_", '<span class="likely-text" data-tippy-content="probable = 66-100% de probabilité">probable</span>');
    txt = txt.replaceAll("_probablement_", '<span class="likely-text" data-tippy-content="probable = 66-100% de probabilité">probablement</span>');
    //txt = txt.replaceAll("_about as likely as not_", '<span class="about-as-likely-as-not-text" data-tippy-content="about as likely as not = 33-66% probability">about as likely as not</span>');
    txt = txt.replaceAll("_unlikely_", '<span class="unlikely-text" data-tippy-content="unlikely = 0-33% probability">unlikely</span>');
    txt = txt.replaceAll("_very unlikely_", '<span class="very-unlikely-text" data-tippy-content="very unlikely = 0-10% probability">very unlikely</span>');
    txt = txt.replaceAll("_exceptionally unlikely_", '<span class="exceptionally-unlikely-text" data-tippy-content="exceptionally unlikely = 0-1% probability">_exceptionally unlikely</span>');
    txt = txt.replaceAll("_extrêmement probable_", '<span class="extremely-likely-text" data-tippy-content="extrêmement probable = 95-100% de probabilité">extrêmement probable</span>');
    txt = txt.replaceAll("_more likely than not_", '<span class="more-likely-than-not-text" data-tippy-content="more likely than not = >50-100% probability">more likely than not</span>');
    txt = txt.replaceAll("_extremely unlikely_", '<span class="extremely-unlikely-text" data-tippy-content="extremely unlikely = 0-5% probability">extremely unlikely</span>');

    txt = txt.replaceAll(TS_chapter_repl, regex_autoref_fn);

    txt = txt.replaceAll(markup_regex, regex_markup_fn); // IMPORTANT d'être en dernier

    return txt;
}

// affichage d'une figure en plein écran
let currentFig = false;
function dispFig(e)
{
    let fig = $(e).attr('data-figref');
    let figdata = wgI.figures[fig];

    currentFig = fig;
    updateHash();

    let figdesc = "";
    // add description for figure
    let figarray = figdata.description[lang] || figdata.description.en_EN;
    console.log(lang,figdata.description[lang]);
    for(let i = 0; i < figarray.length; i++)
    {
        let cites = '';
        if(figdata.cites_by_panel && figdata.cites_by_panel[i])
        {
            for(let k = 0; k < figdata.cites_by_panel[i].length; k++)
            {
                cites += /*html*/`<a href="#" class="src1" data-cite="${figdata.cites_by_panel[i][k]}" onmouseover="return hoverSource(this);" onmouseout="return mouseoutSource(this)" onclick="return dispSource(this)">${figdata.cites_by_panel[i][k]}</a>`;
            }
        }

        let desc = processText(figarray[i]);
        figdesc += `<p>${desc}${cites}</p>`;
    }

    let figtitle = figdata.title[lang] || figdata.title.en_EN;
    let figsubti = figdata.subtitle[lang] || figdata.subtitle.en_EN;
    $('#modal-figure .modal-content').html(`<h4>${fig}: ${figtitle}</h4>
    <p><img onerror="this.src='content/img/en_EN/${fig}.png';" src="content/img/${lang}/${fig}.png"></p>
    <i>Figure ${fig}: ${figsubti}</i>
    ${figdesc}`);
    $('#modal-figure p').html();
    $('#modal-figure .fig-sharelink').attr('href', document.location.href);

    let mod = M.Modal.init(document.getElementById('modal-figure'), {
        endingTop: '4%',
        onCloseStart: function(){
            currentFig = false;
            updateHash();
        }
    });
    mod.open();
    updateTooltips();

    return false;
}

let currentlyLoadedPanel = false;
function loadMainPanel(chapter = 'TS', toRef = false)
{
    marked.setOptions({
        headerPrefix: 'doc-'+chapter+'-'
    });

    $('#main-panel-doc').css('display', 'block');
    if(currentlyLoadedPanel && currentlyLoadedPanel.split('.')[0] == chapter) {
        // TODO do not reload, just display it
        currentlyLoadedPanel = toRef;
        updateHash();
        if(toRef) {
            goToRefInMarkdown(toRef);
        } else {
            window.scrollTo(0, 0);
        }
        return;
    }

    $.get('pdf/chap'+chapter+'.md', function(md){
        let html = processText(marked(md));
        currentlyLoadedPanel = toRef;
        updateHash();

        // insert permalinks in headers
        html = $('<div>'+html+'</div>');

        // OR use marked renderers instead
        // marquer comme lu : seulement sur les § qui ont des identifiants
        // marquer comme lu plutôt quand on arrive en fin de paragraphe avec barre qui montre quelle partie sera marquée comme lue
        // headers sticky sur la partie gauche ou mini-sommaire?
        // TODO div to the left not correct on mobiles
        html.find('h1,h2,h3,h4,h5').each(function(){
            let ref = $(this).find('a[data-cite]').attr('data-cite');
            let already_read = userParams['read'] && userParams['read'][ref]
                ? 'display:inline-block'
                : 'display:none';
            
            let has_prev_section = findEndOfReading(this);
            let disp_mread = '';
            if(!has_prev_section){
                disp_mread = 'style="display:none"';
            };

            let prev_id = has_prev_section?.id || false;
            let prev_ref = $(has_prev_section).find('a[data-cite]').text();

            $(this).prepend(/*html*/`<div class="section-tools hide-on-small-only">
                <a data-tippy-content="Sharing link" href="#lang=${lang}&opened=${ref}">
                    <i class="material-icons">shared</i>
                </a>
                <!--<a href="#"><i class="material-icons">bookmark</i></a>-->
                <a ${disp_mread} href="#"
                    onmouseover="highlightEndOfReading(this, $('#${prev_id}'))"
                    onmouseout="lowlightEndOfReading();"
                    onclick="return markAsRead(this, 'data-mread');"
                    data-mread="${prev_ref}"
                    data-tippy-content="Mark previous section (${prev_ref}) as read">
                    <i class="material-icons">done_all</i>
                </a>
            </div>`).append(/*html*/`<i class="chapter-read material-icons green-text" data-tippy-content="Already read" data-readmarker="${ref}" style="vertical-align:bottom; margin-left:10px;${already_read}">done_all</i>`);
        });
        html.appendTo('#main-panel-holder');

        updateTooltips();
        if(toRef)
        {
            // on attend que toutes les images soient chargées avant de scroller
            $('#main-panel-holder').waitForImages(function(){
                goToRefInMarkdown(toRef);
            });
        }
        else
        {
            window.scrollTo(0, 0);
        }
    });
}

function goToRefInMarkdown(ref)
{
    // https://stackoverflow.com/a/18749238/14799573
    let sanitized = ref.replaceAll('.','').toLowerCase();
    let uRef = "doc-TS-"+sanitized+"-";
    if(ref.split('.')[0] == '1'){
        uRef = "doc-1-"+sanitized+"-";
    }
    console.log("searching for ref", uRef);

    let pos = $('#main-panel-holder').find('h1[id^=\''+uRef+'\'],h2[id^=\''+uRef+'\'],h3[id^=\''+uRef+'\'],h4[id^=\''+uRef+'\'],h5[id^=\''+uRef+'\']').offset();
    if(pos) {
        window.scrollTo(0, pos.top-64);
    } else {
        window.scrollTo(0, 0);
    }
}

function closePanelDoc()
{
    currentlyLoadedPanel = false;
    $('#main-panel-doc').css('display', 'none');
    updateHash();
    return false;
}

function findEndOfReading(element)
{
    let closest = $(element).prevAll('h1,h2,h3,h4,h5');
    if(!closest.length) {
        console.error('no element found');
        return;
    }
    let cur_depth = $(element).prop('tagName').substr(1);
    let found_previous = false;
    for(let i = 0; i < closest.length; i++)
    {
        let depth = $(closest[i]).prop('tagName').substr(1); // retourne H1,H2,H3, donc 1,2,3,4
        if(depth >= cur_depth) {
            found_previous = closest[i];
            break;
        } else {
            break; // we crossed a section
        }
    }

    return found_previous;
}

let readingBar = $('<div style="border-left:6px solid green; background:rgba(0,255,0,0.1)"></div>').appendTo('body');
function highlightEndOfReading(current, previous)
{
    let pos_prev = $(previous).offset();
    let pos_next = $(current).offset();

    readingBar.css({
        position: 'absolute',
        display: 'block',
        top: pos_prev.top,
        height: (pos_next.top - pos_prev.top),
        left: pos_prev.left - 20,
        width: $(previous).parent().width() + 40
    });
}

function lowlightEndOfReading()
{
    readingBar.css('display', 'none');
}