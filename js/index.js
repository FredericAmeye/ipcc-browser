let wgI;
let lang = "en_EN";

function changeLang(lang)
{
    localStorage.setItem('lang',lang);
    document.location.reload();
    return false;
}

let initFn = (function()
{
    // lang selection
    if(document.location.hash === "#lang=fr") {
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
    jQuery.getJSON('content/wgI.json?v2.json', function(r){
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
                    faq += /*html*/`<div class="col s12 m6 l3">
                    
                        <a href="#" onclick="return dispFAQ(this);" data-cite="${chaps[j].ref}">
                            <div class="hoverable faq-card card green lighten-5">
                                <span class="chapter-ref" style="color:black; transform: translateY(-8px)">${chaps[j].ref}</span>
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
    });

    // menu dropdown
    let elems = document.querySelectorAll('.dropdown-trigger');
    let instances = M.Dropdown.init(elems, {
        constrainWidth: false
    });

})();

/* affichage d'une FAQ */
function dispFAQ(e)
{
    let ref = $(e).attr('data-cite');
    let faq = findSourceByRef(ref);

    if(faq) {
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
                html += `<p style="padding:8px 0">${faqtext[i]}</p>`;
            }

            $('#modal-faq .modal-content').html(html);
            let mod = M.Modal.init(document.getElementById('modal-faq'), {});
            mod.open();
            document.location.hash = "#faq="+ref;
        } else {
            // affichage dans le PDF (fallback)
            dispSource(e);
        }
    }

    return false;
}

/* remplit le sommaire */
let TOC_Modal;
function populateToC()
{
    let html = '';
    const order = [/*"SPM",*/"TS","1","2","3","4","5","6","7","8","9","10","11","12"];
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
    let sidenav_inst = M.Sidenav.init(sidenav_elm, {});

    // FULL table of contents in popup:
    html = '';
    for(let i = 0; i < order.length; i++)
    {
        html += recursiveTOC(wgI[ order[i] ], 0);
    }
    $('#modal-toc .modal-content').html("<ul class='toc-holder'>"+html+"</ul>");
    TOC_Modal = M.Modal.init(document.getElementById('modal-toc'), {});
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

            // TODO integrate subchapters
            /*let subchaps = '';
            if(chapter.chapters[k].chapters && chapter.chapters[k].chapters.length)
            {
                for(let z = 0; z < chapter.chapters[k].chapters.length; z++)
                {
                    let subchap = chapter.chapters[k].chapters[z];
                    subchaps += `<li><a href="#">subchap ${z}</a></li>`;
                }
            }*/

            html += /*html*/`<li><a href="#" data-cite="${chapter.chapters[k].ref}" onclick="return dispSource(this);" data-tippy-content="${n}">
            <span class="toc-ref">${chapter.chapters[k].ref}</span>
            ${chaptitle}
            </a></li>`;
        }
        html += `</ul></div></li></ul></li>`;
    }
    return html;
}

function displaySubLevel(e)
{
    $(e).next('.chaplev3-holder').css('display','block');    
    return false;
}

/* change chap niv1 */
function switchChapter(e)
{
    let chapter = $(e).attr('data-chapter');
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
        document.location.hash = "#chapter=SPM."+chapter;
        updateTooltips();

        break;
    }

    // ligne décorative
    $('#SPM-follow-line').css({
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
    document.getElementById('pdf-iframe').contentWindow.PDFViewerApplication.open("../../../pdf/noIMG.pdf");
    // TODO proposer d'utiliser un fichier local plutot que le télécharger

    // affing end of loading callback:
    document.getElementById('pdf-iframe').contentWindow.PDFViewerApplication.eventBus.on('pagerendered', function(e){
        console.log("pagerender",this,e);
        if(pdfGoToPage) {
            setTimeout(function(){
                console.log("asking specific page", pdfGoToPage);
                document.getElementById('pdf-iframe').contentWindow.PDFViewerApplication.page = pdfGoToPage;
                pdfGoToPage = false;
            }, 500);
        }
        pdfLoadInProgress = false;
    });

    return false;
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
}

function pdfChangePage(page)
{
    // TODO split in multiple small pdf files
    if(!pdfAskedForLoad && !pdfLoadInProgress){
        console.log("Asking for a PDF load");
        pdfLoad();
        pdfAskedForLoad = true;
        pdfGoToPage = page;
        return false;
    }

    document.getElementById('pdf-iframe').contentWindow.PDFViewerApplication.page = page;
    document.location.hash = "#reportpage="+page;
}

/* mouse over/out a source : display brief information about it */
function hoverSource(e)
{
    let src = $(e).attr('data-cite');
    let findSrc = findSourceByRef(src);

    // reference has been found in detailed text
    if(findSrc)
    {
        tippy(e, {
            content: "<span class='tooltip-ref-chapter'>" + findSrc.ref + ". " + findSrc.en_EN + "</span>" + getChildChapters(findSrc)
                + "<br><i>click to go to this section</i>",
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
    let refpage = wgI.crossRefs[src];

    if(!refpage)
    {
        // finding it in full text :
        console.log("searching ref in full text");
        let element = findSourceByRef(src);
        if(!element || !element.startPage){
            console.log("could not find ref", src, element);
        }

        // chapitre principal
        if(element.offsetPagesFromFull)
        {
            refpage = element.offsetPagesFromFull;
        }
        else
        {

            let exp_ref = src.split('.');
            let pageOffset = 0;
            if(src.substr(0,3) == "FAQ"){
                // FAQ chapter
                exp_ref = src.substr(3).split('.');
                pageOffset = wgI[ exp_ref[0] ].offsetPagesFromFull;
                console.log(" > searching in FAQ", pageOffset);
            }
            else if(src.substr(0,18) == "Cross-Chapter Box "){
                // CC-Box chapter
                exp_ref = src.substr(18).split('.');
                pageOffset = wgI[ exp_ref[0] ].offsetPagesFromFull;
                console.log(" > searching in CC-Box", pageOffset);
            }
            else if(src.substr(0,4) == "Box "){
                // Box chapter
                exp_ref = src.substr(4).split('.');
                pageOffset = wgI[ exp_ref[0] ].offsetPagesFromFull;
                console.log(" > searching in Box", pageOffset);
            }
            else if(src.substr(0,18) == "Cross-Section Box "){
                // CS-Box chapter
                exp_ref = src.substr(18).split('.');
                pageOffset = wgI[ exp_ref[0] ].offsetPagesFromFull;
                console.log(" > searching in CS-Box", pageOffset);
            }
            else if(exp_ref[0] >= 1 && exp_ref[0] <= 12){
                // regular chapter
                pageOffset = wgI[ exp_ref[0] ].offsetPagesFromFull;
                console.log("setting page offset to", pageOffset);
            }
            else{
                console.log("NO ELEMENT REF");
            }

            refpage = element.startPage + pageOffset;
        }
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

/* find source by ref */
const regular_chapter_match = /^[0-9es.]+$/g;
const TS_chapter_match = /^TS\.[0-9.]+$/g;
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
    // Cross-chapter box
    else if(src.match(CCBox_chapter_match)){
        let path = src.substr(18).split(".");
        if(wgI[ path[0] ]){
            matched = returnElementByRefName(wgI[ path[0] ], src);
        } else {
            console.log("error finding CC-Box ref", src, path);
        }
    }
    // Cross-section box TS
    else if(src.match(CSBox_chapter_match)){
        let path = src.substr(21).split(".");
        matched = returnElementByRefName(wgI.TS, src);
    }
    // box TS
    else if(src.match(BoxTS_chapter_match)){
        let path = src.substr(7).split(".");
        matched = returnElementByRefName(wgI.TS, src);
    }
    // box SPM
    else if(src.match(BoxSPM_chapter_match)){
        let path = src.substr(8).split(".");
        matched = returnElementByRefName(wgI.SPM, src);
    }

    console.info("FOUND", matched);
    return matched;
}

function returnElementByRefName(table, query)
{
    console.log("searching", table.ref, "for",query);
    if(table.ref == query) {
        console.log("early return");
        return table;
    }

    if(table.chapters && table.chapters.length)
    {
        for(let i = 0; i < table.chapters.length; i++)
        {
            console.log("is match?", table.chapters[i].ref, query);
            if(table.chapters[i].ref === query) {
                return table.chapters[i];
            }

            // try subchapters
            let tr = returnElementByRefName(table.chapters[i], query);
            if(tr) {
                return tr;
            }
        }
    }

    return false;
}

const regex_ref = /<ref>([0-9A-Za-z.-]+)<\/ref>/ig;
let regex_ref_fn = function(orig, txt, value){
    let footnote = wgI.SPM.footnotes[txt];
    if(!footnote) return;
    // TODO replace quotes in footnote text

    return /*html*/`<abbr class="tippy footnote-ref" data-tippy-content="${footnote}" data-ref="${txt}"><sup>${txt}</sup></abbr>`;
};
const conf_image = "<br><img src='content/img/en_EN/confidence.png' style='width:500px'>";
function processText(txt)
{
    // confidence levels
    txt = txt.replaceAll("(_high confidence_)", '<span class="high-confidence" data-tippy-content="high confidence'+conf_image+'">+</span>');
    txt = txt.replaceAll("_high confidence_", '<span class="high-confidence-text">high confidence</span>');

    txt = txt.replaceAll("(_very high confidence_)", '<span class="very-high-confidence" data-tippy-content="very high confidence'+conf_image+'">+</span>');
    txt = txt.replaceAll("_very high confidence_", '<span class="very-high-confidence-text">very high confidence</span>');

    txt = txt.replaceAll("(_medium confidence_)", '<span class="medium-confidence" data-tippy-content="medium confidence'+conf_image+'">~</span>');
    txt = txt.replaceAll("_medium confidence_", '<span class="medium-confidence-text">medium confidence</span>');

    txt = txt.replaceAll("(_low confidence_)", '<span class="low-confidence" data-tippy-content="low confidence'+conf_image+'">-</span>');
    txt = txt.replaceAll("_low confidence_", '<span class="low-confidence-text">low confidence</span>');

    txt = txt.replaceAll("(_very low confidence_)", '<span class="very-low-confidence" data-tippy-content="very low confidence'+conf_image+'">-</span>');
    txt = txt.replaceAll("_very low confidence_", '<span class="very-low-confidence-text">very low confidence</span>');

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

    txt = txt.replaceAll(regex_ref, regex_ref_fn);
    return txt;
}

// affichage d'une figure en plein écran
function dispFig(e)
{
    let fig = $(e).attr('data-figref');
    let figdata = wgI.figures[fig];

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

    let mod = M.Modal.init(document.getElementById('modal-figure'), {
        
    });
    mod.open();
    updateTooltips();

    return false;
}