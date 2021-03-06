let wgI;
let lang = (document.location.hostname === 'comprendre-giec.fr') ? "fr_FR" : "en_EN";
let userParams = {};

const chapters_MD = ["1","2","3","4","5","6","7","8","9","10","11","12","Atlas"];
const loadingText = /*html*/`<div class="center" style="margin-bottom:100px">
<h2>Please wait, loading...</h2>
<div class="preloader-wrapper big active">
<div class="spinner-layer spinner-blue">
<div class="circle-clipper left">
  <div class="circle"></div>
</div><div class="gap-patch">
  <div class="circle"></div>
</div><div class="circle-clipper right">
  <div class="circle"></div>
</div>
</div>

<div class="spinner-layer spinner-red">
<div class="circle-clipper left">
  <div class="circle"></div>
</div><div class="gap-patch">
  <div class="circle"></div>
</div><div class="circle-clipper right">
  <div class="circle"></div>
</div>
</div>

<div class="spinner-layer spinner-yellow">
<div class="circle-clipper left">
  <div class="circle"></div>
</div><div class="gap-patch">
  <div class="circle"></div>
</div><div class="circle-clipper right">
  <div class="circle"></div>
</div>
</div>

<div class="spinner-layer spinner-green">
<div class="circle-clipper left">
  <div class="circle"></div>
</div><div class="gap-patch">
  <div class="circle"></div>
</div><div class="circle-clipper right">
  <div class="circle"></div>
</div>
</div>
</div>
</div>
`;

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

    let visits = localStorage.getItem('visits') || 0;
    if(visits > 5 && !localStorage.getItem('nothanks')) {
        // message
        let mod = M.Modal.init(document.getElementById('modal-thanks'), {
            onCloseStart: function(){
                localStorage.setItem('nothanks', true);
            }
        });
        mod.open();
    }
    localStorage.setItem('visits', parseInt(visits, 10) + 1);

    if(lang == "fr_FR"){
        $('.lang-en').remove();
    } else {
        $('.lang-fr').remove();
    }

    /* init page */
    jQuery.getJSON('content/wgI.json?v18.json', function(r){
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
            displayBox(element.elm, false);
        }

        if(urlParams['opened'] && urlParams['opened'].length)
        {
            dispSource($('<div data-cite="'+urlParams['opened']+'"></div>'));
        }

        displayHistory();
        //constructGlossaryRegex();
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

function markUnread(e, tag = 'data-cite')
{
    let ref = $(e).attr(tag);

    if(typeof userParams['read'] === 'undefined')
    {
        userParams['read'] = {};
    }

    delete userParams['read'][ref];
    $('.chapter-read[data-readmarker=\''+ref+'\']').css('display','none');

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
                    html += `<img style="max-width:100%" onerror="this.onerror=null; this.src = 'content/img/en_EN/${faq.figref[i]}.png';" src="content/img/${lang}/${faq.figref[i]}.png">`;
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
        <li class="nav-history">
            <h5>
                Browsing history
                <i class="material-icons right" title="Delete history" style="cursor:pointer; font-size:12px" onclick="delete userParams['history']; saveLocalStorage(); displayHistory();">clear</i>
            </h5>
            <ul></ul>
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
            // sous chapitre : incr??menter le n?? de page :
            page = chapter.startPage + wgI[ref[0]].offsetPagesFromFull;
        }
        spage = `<span class="toc-page">${page}</span>`;
    }

    // was read?
    let readClass = '', readMarker = '';
    if(userParams['read'] && userParams['read'][chapter.ref]) {
        readClass = 'toc-element-read';
        readMarker = '<i class="material-icons green-text right" title="Already read" style="font-size:18px; margin-right:5px">done_all</i>';
    }

    // main chapter => word cloud
    let header = '';
    if(chapters_MD.includes(chapter.ref) || chapter.ref == 'TS')
    {
        let chp = (chapter.ref == 'TS') ? 'Technical Summary': 'Chapter '+chapter.ref;
        header = /*html*/`<li>
            <h1 class="center">${chp}</h1>
            <img src="pdf/${chapter.ref}.png" style="width:100%;">
        </li>`;
    }

    if(chapter.chapters)
    {
        // has child
        let sub_c = '';
        for(let i = 0; i < chapter.chapters.length; i++)
        {
            sub_c += recursiveTOC(chapter.chapters[i], recnum+1);
        }

        return /*html*/`${header}<li style="margin-top:0; border-top:none;" class="${readClass}">
            <a href="#" class="modal-close" onclick="return dispSource(this, true);" data-cite="${chapter.ref}">
                <span class="toc-chaptitle">${chapter.ref}</span>
                ${chaptitle}${spage}${readMarker}
            </a>
            <ul>
                ${sub_c}
            </ul>
        </li>`;
    }
    else
    {
        

        // leaf
        return /*html*/`<li class="${readClass}" data-ref="${chapter.ref}">
                <a href="#" class="modal-close" onclick="return dispSource(this, true);" data-cite="${chapter.ref}">
                    <span class="toc-chaptitle">${chapter.ref}</span>
                    ${chaptitle}${spage}${readMarker}
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
                    <a href="#" onclick="return dispSource(this, true)" data-cite="${chapter.ref}" style="position:absolute; right:0px; top:0; padding:0 5px; width:30px; text-align:center; display:inline-block" data-tippy-content="Read this chapter"><i class="material-icons" style="font-size:0.8em; margin:0; width:20px">open_in_new</i></a>
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

            let dispCss = '';
            if(chapter.chapters[k].ref.startsWith('Cross-') || chapter.chapters[k].ref.startsWith('Box ') || chapter.chapters[k].ref.startsWith('FAQ')) {
                dispCss = 'toc-box';
            }

            html += /*html*/`<li>
                <a href="#" class="${dispCss}" data-cite="${chapter.chapters[k].ref}" onclick="return dispSource(this, true);" data-tippy-content="${n}">
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
                srcs += /*html*/`<a href="#" class="src1" data-cite="${src}" onmouseover="return hoverSource(this);" onmouseout="return mouseoutSource(this)" onclick="return dispSource(this, true)">${src}</a>`;
            }

            // ajout des figures r??f??renc??es
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
                            <img src="content/img/${lang}/${figref}.png" onerror="this.onerror=null; this.src = 'content/img/en_EN/${figref}.png';">
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

                    // r??f??rences ?
                    let refs = '';
                    if(subchap.cites && subchap.cites.length)
                    {
                        refs = 'See: ';
                        for(let n = 0; n < subchap.cites.length; n++)
                        {
                            refs += /*html*/`<a href="#" class="src1" data-cite="${subchap.cites[n]}" onmouseover="return hoverSource(this);" onmouseout="return mouseoutSource(this)" onclick="return dispSource(this, true)">${subchap.cites[n]}</a>`;
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

    // ligne d??corative
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

function addToHistory(ref, type)
{
    if(typeof userParams['history'] == 'undefined'){
        userParams['history'] = [];
    }

    userParams['history'].push({
        type: type,
        ref:  ref,
        date: new Date().getTime()
    });

    // delete oldest if necessary
    if(userParams['history'].length > 200)
    {
        userParams['history'].splice(0, userParams['history'].length - 200);
    }
    

    saveLocalStorage();

    // display new history
    displayHistory();
}

function displayHistory()
{
    let n = 0, html = '';

    if(userParams.history)
    {
        for(let i = userParams.history.length-1; i >= 0; i--)
        {
            if(n > 20) break;
            n++;

            let dh = new Date(userParams.history[i].date);
            let findSrc = findSourceByRef(userParams.history[i].ref);
            let title = findSrc && findSrc.elm
                            ? (findSrc.elm[lang] || findSrc.elm.en_EN)
                            : "";
            title = title.replaceAll('"', '\"');
            let relDate = getRelativeTime(dh);

            html += /*html*/`<li>
                <a href="#" data-cite="${userParams.history[i].ref}" data-tippy-content="${title}" onclick="return dispSource(this, false);">
                ${userParams.history[i].ref}
                ${title}
                <span class="right">${relDate}</span>
                </a>
            </li>`;
        }
    }

    $('.nav-history ul').html(html);
}

function getRelativeTime(dh)
{
    const cur = new Date().getTime();
    const diff_heures = (cur - dh.getTime())/1000/60/60;

    let hh = dh.getHours(), mm = dh.getMinutes();
    hh = ("0"+hh).slice(-2), mm = ("0"+mm).slice(-2);

    if(diff_heures < 24)  {
        return hh+":"+mm;
    } else {
        return dh.getDate()+"/"+(dh.getMonth()+1);
    }
}

/* go to source */
function dispSource(e, fromUserAction = false, force_in_PDF = false)
{
    let src = $(e).attr('data-cite');
    let element;

    // close sidenav if on mobile
    if(window.innerWidth < 992 && sidenav_inst[0].isOpen) {
        sidenav_inst[0].close();
    }

    if(force_in_PDF === false)
    {
        // search in digitized text (markdown)

        if(src.substr(0,2) == 'TS') {
            // part of the TS
            loadMainPanel('TS', src);
            if(fromUserAction) addToHistory(src, 'source');
            return false;
        }
        let chap0 = src.split('.')[0];
        if(chapters_MD.includes(chap0)) {
            // chapter 1 available
            loadMainPanel(chap0, src);
            if(fromUserAction) addToHistory(src, 'source');
            return false;
        }
    }

    // finding it in full text (PDF) :
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
        // d??j?? affich??, on change juste de page
    }
    else
    {
        $('#side-panel-pdf').css('visibility','visible');
    }

    if(fromUserAction) addToHistory(src, 'source');
    pdfChangePage(refpage);

    return false;
}

let currentBox = false;
function displayBox(element, fromUserAction = true)
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
        if(fromUserAction) addToHistory(currentBox, 'box');
        if(MathJax) MathJax.typeset();

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
const CCBoxAtlas_chapter_match = /^Cross-Chapter Box ATLAS\.[0-9.]+$/gi;
const BoxAtlas_chapter_match = /^Box ATLAS\.[0-9.]+$/gi;
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
    else if(src.match(CCBoxAtlas_chapter_match)){
        // Cross-Chapter ATLAS BOX
        matched = returnElementByRefName(wgI['Atlas'], src);
    }
    else if(src.match(BoxAtlas_chapter_match)){
        // Cross-Chapter ATLAS BOX
        matched = returnElementByRefName(wgI['Atlas'], src);
    }
    else if(src == 'Cross-Working Group Box'){
        matched = returnElementByRefName(wgI['1'], src);
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

function returnElementByRefName(table, query, parentOffset = 0, hierarchy = [])
{
    //console.log("searching", table.ref, "for",query, "hierarechy", hierarchy);
    if(table.ref == query) {
        console.log("early return");
        return {
            elm: table,
            offset:0,
            hierarchy: hierarchy
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
                    offset: parentOffset,
                    elm: table.chapters[i],
                    hierarchy: hierarchy
                };
            }

            // try subchapters
            let tr = returnElementByRefName(table.chapters[i], query, parentOffset, hierarchy);
            if(tr) {
                hierarchy.push({
                    ref: table.chapters[i].ref,
                    title: table.chapters[i].lang || table.chapters[i].en_EN
                });
                return tr;
            }
        }
    }

    return false;
}

function getTableAndPopulate(ref, target)
{
    console.log("getAble",ref, target);
    $.get('pdf/tables/'+ref+'.html', function(html){
        // adding processText here breaks table TS.4
        if(html.indexOf('<img') == -1){
            html = processText(html);
        }
        $('#tablePopulate'+target).html(html);
        updateTooltips();
    });
}

// checking for webp support
var WEBP_supported = false;
var webP = new Image();
webP.onload = webP.onerror = function () {
    WEBP_supported = (webP.height == 2);
};
webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';

const TS_chapter_repl = /(Cross-Section Box TS\.[0-9.]+)|(Cross-Chapter Box [0-9.]+)|(Cross-Chapter Box Atlas\.[0-9.]+)|(Box SPM\.[0-9.]+)|(Box TS\.[0-9.]+)|(Infographic TS\.[0-9]+)|(TS\.[0-9.]+)|(SPM\.[0-9.]+)|(FAQ\s?[0-9.]+)|(Box [0-9.]+)|([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)|([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)|([0-9]+\.[0-9]+\.[0-9]+)|(Atlas\.[0-9]+\.[0-9]+\.[0-9]+)|(Atlas\.[0-9]+\.[0-9]+)|(Atlas\.[0-9]+)/g;
let regex_autoref_fn = function(orig, CSBTS, CCB, CCBA, BSPM, BTS, InfoTS, TS, SPM, FAQ, B, ABCDE, ABCD, ABC, AtlasABC, AtlasAB, AtlasA, value, complete_string)
{
    let has_figref_tag = (complete_string.substr(value-8, 8) == '<figref>');
    let has_goto_tag   = (complete_string.substr(value-6, 6) == '<goto>');
    let has_boxref_tag   = (complete_string.substr(value-8, 8) == '<boxref>');
    let has_tableref_tag   = (complete_string.substr(value-10, 10) == '<tableref>');
    if(has_figref_tag || has_goto_tag || has_boxref_tag || has_tableref_tag) {
        return orig; // do nothing
    }
    
    if(orig.substr(0,4) === 'FAQ '){
        orig = orig.replace(' ', '');
        return /*html*/`<a href="#" onclick="return dispFAQ(this);" data-cite="${orig}" class="src1">${orig}</a>`;
    }

    return /*html*/`<a href="#" class="src1" data-cite="${orig}" onmouseover="return hoverSource(this);" onmouseout="return mouseoutSource(this)" onclick="return dispSource(this, true)">${orig}</a>`;
};

const markup_regex = /<(goto|figref|ref|boxref|tableref)>([A-Za-z0-9., -]+)<\/(goto|figref|ref|boxref|tableref)>/g;
let regex_markup_fn = function(orig1, balise, content, balise2, position)
{
    if(balise == 'goto')
    {
        return /*html*/`<a href="#" class="src1" data-cite="${content}" onmouseover="return hoverSource(this);" onmouseout="return mouseoutSource(this)" onclick="return dispSource(this, true)">${content}</a>`;
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

        let fname = (!WEBP_supported) ? content + '.png' : 'webp/'+content+'.webp';

        return /*html*/`<div class="center"><div class="small-figure hoverable" onclick="$(this).find('.fig-clicker').toggle(); $(this).find('.fig-legend-ext').toggle();">
            <img src="content/img/${lang}/${fname}" onerror="this.onerror=null; this.src = 'content/img/en_EN/${fname}';" alt="${content}">
            <span class="fig-legend">${content}: ${fig_title}</span><span class="fig-clicker"> (click to read the legend)</span>
            <div class="fig-legend-ext"><em>${fig_subtitle}</em>${fig_description}</div>
        </div></div>`;
    }
    else if(balise == 'tableref')
    {
        let tab_id = content.replaceAll(' ', '-').replaceAll(',', '-').replaceAll('.','-');
        getTableAndPopulate(content, tab_id);
        return /*html*/`<div class="center">
        <div class="small-figure hoverable">
            <div id="tablePopulate${tab_id}" style="background:#EEE; overflow:auto"></div>
            <span class="fig-legend">Table ${content}</span>
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
    "high confidence":"+", "very high confidence":"???",
    "medium confidence":"~", "low confidence":"-", "very low confidence":"???"
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

const citation_regex = /\(([^)]*et al\.[^)]*)\)/gi;
let citations_cache = [], citations_id = 0;
let regex_citation_fn = function(orig, allcitation){
    if(orig.indexOf('<') !== -1){
        return orig;
    }
    citations_cache.push(allcitation.replaceAll("\n", ""));
    citations_id++;
    return '<i class="material-icons citation-sh" onclick="navigator.clipboard.writeText(citations_cache['+(citations_id-1)+'])" data-tippy-content="'+allcitation+'<br><small>click to copy citation in clipboard</small>">format_quote</i>';
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
    txt = txt.replaceAll("(_fiabilit?? forte_)", '<span class="high-confidence" data-tippy-content="fiabilit?? forte'+conf_image+'">+</span>');
    txt = txt.replaceAll("_fiabilit?? forte_", '<span class="high-confidence-text">fiabilit?? forte</span>');

    txt = txt.replaceAll("(_fiabilit?? tr??s ??lev??e_)", '<span class="very-high-confidence" data-tippy-content="fiabilit?? tr??s ??lev??e'+conf_image+'">+</span>');
    txt = txt.replaceAll("_fiabilit?? tr??s ??lev??e_", '<span class="very-high-confidence-text">fiabilit?? tr??s ??lev??e</span>');

    txt = txt.replaceAll("(_fiabilit?? moyenne_)", '<span class="medium-confidence" data-tippy-content="fiabilit?? moyenne'+conf_image+'">~</span>');
    txt = txt.replaceAll("_fiabilit?? moyenne_", '<span class="medium-confidence-text">fiabilit?? moyenne</span>');

    txt = txt.replaceAll("(_fiabilit?? faible_)", '<span class="low-confidence" data-tippy-content="fiabilit?? faible'+conf_image+'">-</span>');
    txt = txt.replaceAll("_fiabilit?? faible_", '<span class="low-confidence-text">fiabilit?? faible</span>');

    txt = txt.replaceAll("(_fiabilit?? tr??s faible_)", '<span class="very-low-confidence" data-tippy-content="fiabilit?? tr??s faible'+conf_image+'">-</span>');
    txt = txt.replaceAll("_fiabilit?? tr??s faible_", '<span class="very-low-confidence-text">fiabilit?? tr??s faible</span>');

    // certainty level FR
    txt = txt.replaceAll("_pratiquement certain_", '<span class="virtually-certain-text" data-tippy-content="pratiquement certain = 99-100% de probabilit??">pratiquement certain</span>');
    txt = txt.replaceAll("_tr??s probable_", '<span class="very-likely-text" data-tippy-content="tr??s probable = 90-100% de probabilit??">tr??s probable</span>');
    txt = txt.replaceAll("_tr??s probablement_", '<span class="very-likely-text" data-tippy-content="tr??s probablement = 90-100% de probabilit??">tr??s probablement</span>');
    txt = txt.replaceAll("_probable_", '<span class="likely-text" data-tippy-content="probable = 66-100% de probabilit??">probable</span>');
    txt = txt.replaceAll("_probablement_", '<span class="likely-text" data-tippy-content="probable = 66-100% de probabilit??">probablement</span>');
    //txt = txt.replaceAll("_about as likely as not_", '<span class="about-as-likely-as-not-text" data-tippy-content="about as likely as not = 33-66% probability">about as likely as not</span>');
    txt = txt.replaceAll("_unlikely_", '<span class="unlikely-text" data-tippy-content="unlikely = 0-33% probability">unlikely</span>');
    txt = txt.replaceAll("_very unlikely_", '<span class="very-unlikely-text" data-tippy-content="very unlikely = 0-10% probability">very unlikely</span>');
    txt = txt.replaceAll("_exceptionally unlikely_", '<span class="exceptionally-unlikely-text" data-tippy-content="exceptionally unlikely = 0-1% probability">_exceptionally unlikely</span>');
    txt = txt.replaceAll("_extr??mement probable_", '<span class="extremely-likely-text" data-tippy-content="extr??mement probable = 95-100% de probabilit??">extr??mement probable</span>');
    txt = txt.replaceAll("_more likely than not_", '<span class="more-likely-than-not-text" data-tippy-content="more likely than not = >50-100% probability">more likely than not</span>');
    txt = txt.replaceAll("_extremely unlikely_", '<span class="extremely-unlikely-text" data-tippy-content="extremely unlikely = 0-5% probability">extremely unlikely</span>');

    //txt = applyGlossaryToText(txt); // WARNING apply glossary only to <p>
    txt = txt.replaceAll(TS_chapter_repl, regex_autoref_fn);
    txt = txt.replaceAll(markup_regex, regex_markup_fn); // IMPORTANT d'??tre en dernier
    txt = txt.replaceAll(citation_regex, regex_citation_fn);

    return txt;
}

// affichage d'une figure en plein ??cran
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
                cites += /*html*/`<a href="#" class="src1" data-cite="${figdata.cites_by_panel[i][k]}" onmouseover="return hoverSource(this);" onmouseout="return mouseoutSource(this)" onclick="return dispSource(this, true)">${figdata.cites_by_panel[i][k]}</a>`;
            }
        }

        let desc = processText(figarray[i]);
        figdesc += `<p>${desc}${cites}</p>`;
    }

    let figtitle = figdata.title[lang] || figdata.title.en_EN;
    let figsubti = figdata.subtitle[lang] || figdata.subtitle.en_EN;
    $('#modal-figure .modal-content').html(`<h4>${fig}: ${figtitle}</h4>
    <p><img onerror="this.onerror=null; this.src='content/img/en_EN/${fig}.png';" src="content/img/${lang}/${fig}.png"></p>
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

let currentlyLoadedPanel = false, panelImageLoadingInterval = null,
currentlyLoadedChapter = false;
function loadMainPanel(chapter = 'TS', toRef = false)
{
    marked.setOptions({
        headerPrefix: 'doc-'+chapter+'-'
    });

    $('#main-panel-doc').css('display', 'block');
    if(currentlyLoadedPanel && currentlyLoadedPanel.split('.')[0] == chapter) {
        // do not reload, just display it
        currentlyLoadedPanel = toRef;
        updateHash();
        if(toRef) {
            goToRefInMarkdown(toRef);
        } else {
            window.scrollTo(0, 0);
        }
        return;
    }

    /* preloader */
    $('#main-panel-holder').html(loadingText);
    $('.main-panel-minitoc-container ul').html('');

    /* loading content */
    $.get('pdf/chap'+chapter+'.md', function(md){
        console.time('process');
        let html = processText(marked(md));
        currentlyLoadedPanel = toRef;
        currentlyLoadedChapter = chapter;
        updateHash();

        // insert wordcloud in headers
        if(chapter != 'Atlas')
            html = $('<div><img src="pdf/'+chapter+'.png" style="margin-top:15px; max-width:100%">'+html+'</div>');
        else
            html = $('<div>'+html+'</div>');

        // headers sticky sur la partie gauche ou mini-sommaire?
        // TODO div to the left not correct on mobiles
        html.find('h1,h2,h3,h4,h5').each(function(){
            let ref = $(this).find('a[data-cite]').attr('data-cite');
            let already_read = userParams['read'] && userParams['read'][ref]
                ? 'display:inline-block'
                : 'display:none';
            
            let has_prev_section = findEndOfReading(this);
            let disp_mread = '';
            let prev_id = has_prev_section?.id || false;
            let prev_ref = $(has_prev_section).find('a[data-cite]').attr('data-cite');

            // do not display "mark read" if previous section is unknown
            if(!has_prev_section || !prev_ref){
                disp_mread = 'style="display:none"';
            }

            // do not display "mark read" if already marked as read
            if(prev_ref && userParams['read'] && userParams['read'][prev_ref]){
                disp_mread = 'style="display:none"';

                // but instead show a green background for previous section
                if(prev_id){
                    $(this).prevUntil('#'+prev_id).addClass('textBlock-read');
                }
            }

            // click action to color in green until previous section
            let clickAction = prev_id ? '$(this).parent().parent().prevUntil(\'#'+prev_id+'\').addClass(\'textBlock-read\');' : '';
            let unClickAction = prev_id ? '$(this).parent().nextUntil(\'#'+this.id+'\').removeClass(\'textBlock-read\');' : '';
            let shareLink = ref ? /*html*/`<a class="right" data-tippy-content="Sharing link to section ${ref}" href="#lang=${lang}&opened=${ref}">
                <i class="material-icons">shared</i>
            </a>` : '';
            let isBook = ref ? isBookmarked(ref) : false;
            let book_icon = isBook ? 'bookmark':'bookmark_border';
            let book_class = isBook ? 'bookmarked':'';
            let book_text = isBook ? "<br>(already bookmarked)":"";
            let bookmarkLink = ref ? /*html*/`<a class="right ${book_class}" data-tippy-content="Bookmark ${ref}${book_text}" onclick="return setBookmark(this);" data-bookmark="${ref}" href="#">
                <i class="material-icons">${book_icon}</i>
            </a>` : '';
            let pdfLink = ref ? /*html*/`<a class="right" data-tippy-content="View section in original PDF" onclick="return dispSource(this, true, true);" data-cite="${ref}" href="#">
                <i class="material-icons">picture_as_pdf</i>
            </a>` : '';
            let markReadLink = ref ? /*html*/`<a class="right" data-tippy-content="Mark section as read" data-mread="${ref}" onclick="return markAsRead(this, 'data-mread');" href="#">
                <i class="material-icons">spellcheck</i>
            </a>` : '';

            // if section is read, put paragraphs in the correct class
            if(userParams['read'] && userParams['read'][ref]) {
                $(this).nextUntil('h1,h2,h3,h4,h5').addClass('textBlock-read');
                // TODO refine h1,h2,h3 in function of current section depth
            }


            $(this).prepend(/*html*/`<div class="section-tools hide-on-small-only">
                <!--<a href="#"><i class="material-icons">bookmark</i></a>-->
                <a ${disp_mread} style="position:absolute; top:-55px;" href="#"
                    onmouseover="highlightEndOfReading(this, $('#${prev_id}'))"
                    onmouseout="lowlightEndOfReading();"
                    onclick="${clickAction} return markAsRead(this, 'data-mread');"
                    data-mread="${prev_ref}"
                    data-tippy-content="Mark previous section (${prev_ref}) as read">
                    <i class="material-icons">done_all</i>
                </a>
            </div>`).append(/*html*/`<i class="chapter-read material-icons green-text" onclick="${unClickAction} return markUnread(this, 'data-readmarker');" data-tippy-content="Already read ; click to mark as unread" data-readmarker="${ref}" style="vertical-align:bottom; margin-left:10px;${already_read}">done_all</i>
            ${shareLink}
            ${bookmarkLink}
            ${pdfLink}
            ${markReadLink}
            `);
        });
        $('#main-panel-holder').html('');
        html.appendTo('#main-panel-holder');
        if(MathJax) MathJax.typeset();

        updateTooltips();
        if(toRef)
        {
            // on attend que toutes les images soient charg??es avant de scroller
            // toutes les 300ms on remet la position au bon endroit (car le chargement des images d??cale la page)
            panelImageLoadingInterval = setInterval(function(){
                goToRefInMarkdown(toRef);
            }, 300);

            $('#main-panel-holder').waitForImages(function(){
                goToRefInMarkdown(toRef);
                if(panelImageLoadingInterval !== null) {
                    clearInterval(panelImageLoadingInterval);
                    panelImageLoadingInterval = null;
                }
            });
        }
        else
        {
            window.scrollTo(0, 0);
        }

        populateMiniToc();
    });
}

function resizeMiniToc()
{
    let size_avail = $(window).width() - 1000 - 350 - 30;
    if(size_avail / 2 >= 300) {
        // let the text centered
        $('#main-panel-minitoc').css('max-width', Math.floor(size_avail/2)+"px")
            .css('display','block');
        $('#main-panel-holder').css('margin','0 auto');
    } else {
        // put the block of text to the right
        let w = Math.min(300, size_avail - 50); // max 300px of width
        if(w <= 120) {
            // too small, better not to display it...
            $('#main-panel-minitoc').css('display','none');
            $('#main-panel-holder').css('margin','0 auto');
            return false;
        }
        $('#main-panel-minitoc').css('display','block');
        $('#main-panel-holder').css('margin-right',0).css('margin-left', (w+50)+'px');
        $('#main-panel-minitoc').css('max-width', w+"px");
    }
}
window.onresize = function(){
    resizeMiniToc();
};

function populateMiniToc()
{
    resizeMiniToc();
    let d = wgI[currentlyLoadedChapter];
    $('.main-panel-minitoc-container ul').html(miniTocRecursive(d));
}

function miniTocRecursive(chapter)
{
    if(chapter.ref.startsWith('Box ') || chapter.ref.startsWith('Cross-') || chapter.ref.startsWith('FAQ')) return '';

    let t = chapter[lang] || chapter.en_EN;
    if(chapter.chapters)
    {
        let c = '';
        for(let i = 0; i < chapter.chapters.length; i++)
        {
            c += miniTocRecursive(chapter.chapters[i]);
        }

        return `<li data-ref="${chapter.ref}"><a data-cite="${chapter.ref}" onclick="return dispSource(this, true);" href="#">${chapter.ref} ${t}</a><ul>${c}</ul></li>`;
    }
    else
    {
        let read = userParams['read'] && userParams['read'][chapter.ref]
            ? '&nbsp;<span style="color:green; vertical-align:bottom; font-size:1.5em;">???</span>' : '';
        return `<li data-ref="${chapter.ref}"><a data-cite="${chapter.ref}" onclick="return dispSource(this, true);" href="#">${chapter.ref} ${t}${read}</a></li>`;
    }
}

// return list of sections that are "before" the current position of scroll.
// the last element of the returned array is the paragraph currently being read.
function getPositionInStructure()
{
    let docViewTop = $(window).scrollTop();
    let docViewBottom = docViewTop + $(window).height();

    let visible = [];
    // TODO optimize by caching such value
    $('#main-panel-holder').find('h1,h2,h3,h4,h5').each(function(){
        let top = $(this).offset().top;
        if(/*top >= docViewTop &&*/ top <= docViewBottom){
            if(!$(this).find('a[data-cite]').length){
                return true; // skip those who are not referenced
            }
            visible.push($(this));
        }
    });

    if(!visible.length){
        return false;
    }

    let ref_vis = [];
    for(let i = 0; i < visible.length; i++)
    {
        ref_vis.push( visible[i].find('a[data-cite]').attr('data-cite') );
    }

    return ref_vis;
}

function miniTocUpdate()
{
    if(document.getElementById('main-panel-minitoc').style.display == 'none')
        return;

    let before = getPositionInStructure();
    let current = before[before.length-1];

    $('.toc-current').removeClass('toc-current');
    let target = $('.main-panel-minitoc-container ul li[data-ref="'+current+'"]');
    target.addClass('toc-current').parentsUntil('ul', 'li').css('color','green');

    // is the element in the ToC visible? If not, scroll ToC to make it visible.
    let targetTop = target.position().top;
    if(targetTop < -5 || targetTop > $('#main-panel-minitoc').height()+2) {
        document.getElementById('main-panel-minitoc').scrollTop = targetTop;
    }
}

let lastScrollEvent = new Date().getTime(), lastScrollPos = 0;
window.addEventListener('scroll', function(e){
    let t = new Date().getTime();
    if(Math.abs(window.scrollY - lastScrollPos) > 50
        || (t - lastScrollEvent) > 700)
    {
        miniTocUpdate();
        lastScrollPos = window.scrollY;
        lastScrollEvent = t;
    }
});

function goToRefInMarkdown(ref)
{
    // https://stackoverflow.com/a/18749238/14799573
    let sanitized = ref.replaceAll('.','').toLowerCase();
    let uRef = "doc-TS-"+sanitized+"-";
    let chap = ref.split('.')[0];
    if(chapters_MD.includes(chap)){
        uRef = "doc-"+chap+"-"+sanitized+"-";
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

let readingBar = $('<div style="border-left:6px solid green; background:rgba(0,255,0,0.1); z-index:5"></div>').appendTo('body');
function highlightEndOfReading(current, previous)
{
    let pos_prev = $(previous).offset();
    let pos_next = $(current).offset();

    readingBar.css({
        position: 'absolute',
        display: 'block',
        top: pos_prev.top,
        height: (pos_next.top - pos_prev.top) + 50,
        left: pos_prev.left - 15,
        width: $(previous).parent().width() + 30
    });
}

function lowlightEndOfReading()
{
    readingBar.css('display', 'none');
}

function generateBreadcrumbFromReference(ref)
{
    let uref = ref.split('.');
    let target = wgI[uref[0]];

    let e = returnElementByRefName(target, ref);
    console.log(e);

    if(!e || !e.hierarchy)
        return false;
    
    let html = '';
    for(let i = e.hierarchy.length-1; i >= 0; i--)
    {
        html += `<a href="#" class="breadcrumb">${e.hierarchy[i].ref} ${e.hierarchy[i].title}</a>`;
    }

    $('#breadcrumb').html(html);
    return html;
}

let reg_sensitive, reg_insensitive;
function constructGlossaryRegex()
{
    let case_sensitive = [], case_insensitive = [];
    for(key in wgI.glossary.en_EN)
    {
        let desc = wgI.glossary.en_EN[key];
        key = key.replaceAll('(', '\\(').replaceAll(')', '\\)').replaceAll('+','\\+').replaceAll('/', '\\/');

        if(desc.substr(0, 4) === 'REF:'){
            // acronym reference : case-sensitive
            case_sensitive.push(key);
        } else {
            // description : case-insensitive
            case_insensitive.push(key);
        }
    }

    reg_sensitive = new RegExp("(" + case_sensitive.join('|') + ")", "gu");
    console.log("(" + case_sensitive.join('|') + ")");
    reg_insensitive = new RegExp("(" + case_insensitive.join('|') + ")", "giu");
    console.log("(" + case_insensitive.join('|') + ")");
}

let fn_match_glossary = function(orig, ref)
{
    if(ref == '' || ref == ' ') return orig;
    //console.log(ref);
    //return orig;
    return '<b style="color:red">'+ref+'</b>';
};

function applyGlossaryToText(text)
{
    text = text.replaceAll(reg_sensitive, fn_match_glossary);
    text = text.replaceAll(reg_insensitive, fn_match_glossary);
    return text;
}

let ref_to_bookmark = false;
function setBookmark(elm)
{
    ref_to_bookmark = $(elm).attr('data-bookmark');

    // populate <select> with correct categories :
    let src_cat = userParams['categories'] || [];
    let elms = '';
    for(let i = 0; i < src_cat.length; i++)
    {
        let nb_elms = (userParams?.bookmarks?.[i] || []).length;
        elms += /*html*/`<option value="${i}">${src_cat[i]} (${nb_elms} elements)</option>`;
    }
    elms += /*html*/`<option value="-1">+add new category+</option>`;
    $('#bookmarkadd-cat').html(elms);
    // end populating <select> with categories

    // reset few fields:
    $('#bookmarkadd-comment').val('');
    $('#bookmarkadd-newcat').val('');
    
    // display by default of the "add new category" block?
    if(src_cat.length == 0){
        $('.bookmarkadd-addcontainer').css('display','block');
    } else {
        $('.bookmarkadd-addcontainer').css('display','none');
    }

    M.Modal.init(document.getElementById('modal-bookmarkadd'), {}).open();
    return false;
}

// from popup
function addBookmark()
{
    let cat = $('#bookmarkadd-cat').val();
    if(cat == -1) {
        // add new category
        let catname = $('#bookmarkadd-newcat').val();
        if(typeof userParams['categories'] == 'undefined'){
            userParams['categories'] = [];
        }
        userParams['categories'].push(catname);
        cat = userParams['categories'].length - 1;
    }

    // save bookmark in params
    if(typeof userParams['bookmarks'] == 'undefined'){
        userParams['bookmarks'] = {};
    }
    if(typeof userParams['bookmarks'][cat] == 'undefined'){
        userParams['bookmarks'][cat] = [];
    }

    userParams['bookmarks'][cat].push({
        'ref': ref_to_bookmark,
        'date': new Date().getTime(),
        'comment': $('#bookmarkadd-comment').val()
    });

    $('a[data-bookmark="'+ref_to_bookmark+'"]').addClass('bookmarked').find('i').text('bookmark');

    saveLocalStorage();
    ref_to_bookmark = false;

    return false;
}

function isBookmarked(ref)
{
    if(typeof userParams['bookmarks'] == 'undefined')
        return false;
    
    for(let cat in userParams['bookmarks'])
    {
        for(let i = 0; i < userParams['bookmarks'][cat].length; i++)
        {
            if(userParams['bookmarks'][cat][i].ref == ref) return true;
        }
    }

    return false;
}

function escapeHTML(unsafeText)
{
    let div = document.createElement('div');
    div.innerText = unsafeText;
    return div.innerHTML;
}

var _bookmarkModal = null;
function dispBookmarksPanel()
{
    let html = '';
    let cats = userParams.categories || [];

    html += '<div class="row">';
    for(let i = 0; i < cats.length; i++)
    {
        // iterating over the bookmarks in this category
        let html_bookmarks = '';
        let bm = userParams.bookmarks?.[i] || [];
        for(let j = 0; j < bm.length; j++)
        {
            let name = findSourceByRef(bm[j]['ref'])?.elm || {};
            name = name[lang] || name?.en_EN;

            html_bookmarks += /*html*/`<li class="collection-item">
                <span class="title"><a href="#" data-cite="${bm[j]['ref']}" onclick="_bookmarkModal.close(); return dispSource(this, true);">${bm[j]['ref']} ${name}</a></span>
                <a href="#!" onclick="return deleteBookmark(this, ${i}, ${j});" class="secondary-content"><i class="material-icons" style="font-size:1em">clear</i></a>
                <p style="font-size:0.7em; line-height:0.9em; color:#555">${escapeHTML(bm[j]['comment'])}</p>
            </li>`;
        }

        // card for the category
        html += /*html*/`<div class="col s12 m6 l4">
            <div class="card blue-grey darken-1">
                <div class="card-content white-text" style="padding:14px">
                    <span class="card-title">${escapeHTML(cats[i])}</span>
                    <ul class="collection black-text">${html_bookmarks}</ul>
                </div>
            </div>
        </div>`;
    }
    html += '</div>';

    if(cats.length == 0){
        html += '<p>You don\'t have any categories or bookmarks added yet. To add some, click on the bookmark icon <i class="material-icons">bookmark_border</i> on the right of each section title.</p>';
    }

    $('.bookmarks-holder').html(html);
    _bookmarkModal = M.Modal.init(document.getElementById('modal-bookmarks'), {
        endingTop: '4%'
    });
    _bookmarkModal.open();

    return false;
}

function deleteBookmark(elm, cat_id, bk_id)
{
    userParams['bookmarks'][cat_id].splice(bk_id, 1);
    saveLocalStorage();
    $(elm).closest('.collection-item').remove();

    // reload popup because id's have changed now!
    dispBookmarksPanel();

    return false;
}

function dispSettingsPanel()
{
    $('#export-button').attr('href', 'data:text/json;charset=utf-8,'+encodeURIComponent("@@[v1]@@;"+localStorage.getItem('settings')));
    M.Modal.init(document.getElementById('modal-settings'), {
        endingTop: '4%'
    }).open();
    return false;
}

function importConfigTrigger()
{
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.click();
    input.onchange = function(e){
        let file = e.target.files[0];
        let reader = new FileReader();
        reader.readAsText(file,'UTF-8');
        reader.onload = function(rdEvt){
            let content = rdEvt.target.result;
            if(content.length)
            {
                if(content.substr(0, 9) == '@@[v1]@@;')
                {
                    content = content.substr(9);
                    localStorage.setItem('settings', content);
                    userParams = JSON.parse(content);
                    alert('Your settings have been loaded correctly. The page will now refresh.');
                    document.location.reload();
                    return false;
                }
            }
            alert('Could not import this configuration file.');
        };

    };

    return false;
}