let wgI;
let initFn = (function()
{
    /* init page */
    jQuery.getJSON('content/wgI.json', function(r){
        const nb_chap = r.SPM.chapters.length;
        wgI = r;
        
        let lev1 = '';
        for(let c = 0; c < nb_chap; c++)
        {
            let chap = r.SPM.chapters[c];
            lev1 += /*html*/`
            <div class="col s12 m6 l3">
                <a href="#" data-chapter="${chap.ref}" onclick="return switchChapter(this);" class="href-card"><div class="hoverable card blue-grey darken-1">
                    <span style="opacity:0.3; position:absolute; right:5px; font-size:50px; font-family:inter; color:white;">${chap.ref}</span>
                    <div class="card-content white-text">
                        <span class="card-title">${chap.en_EN}</span>
                        <p>${chap.fr_FR}</p>
                    </div>
                </div>
            </div>`;
        }

        jQuery('#SPM-chapters-level1').html(lev1);
        populateToC();
    });
})();

/* remplit le sommaire */
function populateToC()
{
    let html = '';
    const order = ["SPM","1","2","3","4","5","6"];
    for(let i = 0; i < order.length; i++)
    {
        console.log(i, wgI[order[i]].en_EN);
        html += constructSubMenu(wgI[ order[i] ], 0);
    }
    $('#slide-out').html(html);

    var elems = document.querySelectorAll('.collapsible');
    var instances = M.Collapsible.init(elems);
    updateTooltips();
}

function constructSubMenu(chapter, recnum)
{
    if(recnum > 1) return '';

    let html = '';
    if(chapter.chapters && chapter.chapters.length)
    {
        // has child
        html += `<li class="no-padding">
            <ul class="collapsible collapsible-accordion">
                <li>
                    <a class="collapsible-header">${chapter.ref}. ${chapter.en_EN}<i class="material-icons">arrow_drop_down</i></a>
                    <div class="collapsible-body">
                        <ul>
                `;
        for(let k = 0; k < chapter.chapters.length; k++)
        {
            // TODO escape quotes
            // TODO remove FAQ and maybe crosschapter to put them somewhere else?
            let n = chapter.chapters[k].ref + ". " + chapter.chapters[k].en_EN;
            html += `<li><a href="#" data-tippy-content="${n}">
            <span class="toc-ref">${chapter.chapters[k].ref}</span>
            ${chapter.chapters[k].en_EN}
            </a></li>`;
        }
        html += `</ul></div></li></ul></li>`;
    }
    return html;
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

            let srcs = '';
            // citations du chapitre
            for(let k = 0; k < chp.cites.length; k++)
            {
                let src = chp.cites[k];
                srcs += /*html*/`<a href="#" class="src1" data-cite="${src}" onclick="return dispSource(this)">${src}</a>`;
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

            html += /*html*/`
            <div class="card-panel chaplev2">
                <span class="chap-ref">${chp.ref}</span>
                <p>${chp.en_EN}</p>
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
                    let txt = processText(subchap.en_EN);

                    // références ?
                    let refs = '';
                    if(subchap.cites && subchap.cites.length)
                    {
                        refs = 'See: ';
                        for(let n = 0; n < subchap.cites.length; n++)
                        {
                            refs += /*html*/`<a href="#" class="src1" data-cite="${subchap.cites[n]}" onclick="return dispSource(this)">${subchap.cites[n]}</a>`;
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
        updateTooltips();

        break;
    }

    // ligne décorative
    $('#SPM-follow-line').css({
        top: $(e).position().top,
        height: $('#SPM-chapters-level2').position().top - $(e).position().top + $('#SPM-chapters-level2').height()
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
let pdfAskedForLoad = false, pdfLoadInProgress = false;
function pdfLoad()
{
    pdfLoadInProgress = true;
    document.getElementById('pdf-iframe').contentWindow.PDFViewerApplication.open("/pdf/noIMG.pdf");
    
    // TODO proposer d'utiliser un fichier local plutot que le télécharger

    // affing end of loading callback:
    document.getElementById('pdf-iframe').contentWindow.PDFViewerApplication.eventBus.on('pagerendered', function(e){
        console.log("pagerender",this,e);
        pdfLoadInProgress = false;
    });
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
        return false;
    }

    document.getElementById('pdf-iframe').contentWindow.PDFViewerApplication.page = page;
}

/* go to source */
function dispSource(e)
{
    console.log(e);
    let src = $(e).attr('data-cite');
    let refpage = wgI.crossRefs[src];
    if(!refpage){
        console.error("reference not found", src);
        // TODO find closest by hierarchy
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

const regex_ref = /<ref>([0-9A-Za-z.-]+)<\/ref>/ig;
let regex_ref_fn = function(orig, txt, value){
    let footnote = wgI.SPM.footnotes[txt];
    if(!footnote) return;
    // TODO replace quotes in footnote text

    return /*html*/`<abbr class="tippy footnote-ref" data-tippy-content="${footnote}" title="Footnote" data-ref="${txt}"><sup>${txt}</sup></abbr>`;
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
    for(let i = 0; i < figdata.description.en_EN.length; i++)
    {
        let cites = '';
        if(figdata.cites_by_panel && figdata.cites_by_panel[i])
        {
            for(let k = 0; k < figdata.cites_by_panel[i].length; k++)
            {
                cites += /*html*/`<a href="#" class="src1" data-cite="${figdata.cites_by_panel[i][k]}" onclick="return dispSource(this)">${figdata.cites_by_panel[i][k]}</a>`;
            }
        }

        let desc = processText(figdata.description.en_EN[i]);
        figdesc += `<p>${desc}${cites}</p>`;
    }

    $('#modal-figure .modal-content').html(`<h4>${fig}: ${figdata.title.en_EN}</h4>
    <p><img src="content/img/en_EN/${fig}.png"></p>
    <i>Figure ${fig}: ${figdata.subtitle.en_EN}</i>
    ${figdesc}`);
    $('#modal-figure p').html();

    let mod = M.Modal.init(document.getElementById('modal-figure'), {
        
    });
    mod.open();
    updateTooltips();
}