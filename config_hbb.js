// Configuration options
const init_phones = ["Bad Guy 2022 Target","IEF Comp Target"],             // Optional. Which graphs to display on initial load. Note: Share URLs will override this set
      DIR = "data/",                                // Directory where graph files are stored
	  DBDIR = "data/audio_db/",
      TARGETDIR = "data/targets/",
      default_channels = ["R"],                     // Which channels to display. Avoid javascript errors if loading just one channel per phone
      default_normalization = "Hz",                 // Sets default graph normalization mode. Accepts "dB" or "Hz"
      default_norm_db = 60,                         // Sets default dB normalization point
      default_norm_hz = 1000,                       // Sets default Hz normalization point (500Hz is recommended by IEC)
      max_channel_imbalance = 5,                    // Channel imbalance threshold to show ! in the channel selector
      alt_layout = true,                            // Toggle between classic and alt layouts
      alt_sticky_graph = true,                      // If active graphs overflows the viewport, does the graph scroll with the page or stick to the viewport?
      alt_animated = true,                          // Determines if new graphs are drawn with a 1-second animation, or appear instantly
      alt_header = true,                            // Display a configurable header at the top of the alt layout
      alt_header_new_tab = false,                   // Clicking alt_header links opens in new tab
      alt_tutorial = true,                          // Display a configurable frequency response guide below the graph
      alt_augment = true,                           // Display augment card in phone list, e.g. review sore, shop link
      site_url = 'index.html',                      // URL of your graph "homepage"
      share_url = true,                             // If true, enables shareable URLs
      watermark_text = "",                          // Optional. Watermark appears behind graphs
      watermark_image_url = "BGF.png",              // Optional. If image file is in same directory as config, can be just the filename
      page_title = "Squiglink by HBB",              // Optional. Appended to the page title if share URLs are enabled
      page_description = "View and compare frequency response graphs for earphones",
      accessories = true,                           // If true, displays specified HTML at the bottom of the page. Configure further below
      externalLinksBar = true,                      // If true, displays row of pill-shaped links at the bottom of the page. Configure further below
      restricted = false,                           // Enables restricted mode. More restricted options below
      expandable = false,                           // Enables button to expand iframe over the top of the parent page
      expandableOnly = false,                       // Prevents iframe interactions unless the user has expanded it. Accepts "true" or "false" OR a pixel value; if pixel value, that is used as the maximum width at which expandableOnly is used
      headerHeight = '0px',                         // Optional. If expandable=true, determines how much space to leave for the parent page header
      darkModeButton = false,                       // Adds a "Dark Mode" button the main toolbar to let users set preference
      targetDashed = true,                          // If true, makes target curves dashed lines
      targetColorCustom = false,                    // If false, targets appear as a random gray value. Can replace with a fixed color value to make all targets the specified color, e.g. "black"
      labelsPosition = "top-left",                  // Up to four labels will be grouped in a specified corner. Accepts "top-left," bottom-left," "bottom-right," and "default"
      stickyLabels = true,                          // "Sticky" labels 
      analyticsEnabled = true,                      // Enables Google Analytics 4 measurement of site usage
      exportableGraphs = true,                      // Enables export graph button
      extraEnabled = true,                          // Enable extra features
      extraUploadEnabled = true,                    // Enable upload function
      extraEQEnabled = true,                        // Enable parametic eq function
      extraEQBands = 10,                            // Default EQ bands available
      extraEQBandsMax = 20,                         // Max EQ bands available
      extraToneGeneratorEnabled = true;             // Enable tone generator function

// Specify which targets to display
const targets = [
    { type:"Δ" , files:["Δ 10dB","IEF Comp"] },
    { type:"Reference Targets" , files:["Bad Guy 2022","Crinacle 2023 Adjusted","Super 2022 Adjusted"] },
    { type:"Reviewer Targets", files:["Bad Guy","MRS","IEF","Timmy", "Antdroid", "RikudouGoku","Diffuse Field","Etymotic","Free Field", "Precog", "Redeyes"]    }
];



// *************************************************************
// Functions to support config options set above; probably don't need to change these
// *************************************************************

// Set up the watermark, based on config options above
function watermark(svg) {
    let wm = svg.append("g")
        //.attr("transform", "translate("+(pad.l+W/2)+","+(pad.t+H/2-20)+")")
        .attr("opacity",1.0);
    
    if ( watermark_image_url ) {
        wm.append("image")
            .attrs({x:0, y:0, width:800, height:350, "xlink:href":watermark_image_url});
    }
    
    if ( watermark_text ) {
        wm.append("text")
            .attrs({x:0, y:70, "font-size":28, "text-anchor":"middle", "class":"graph-name"})
            .text(watermark_text);
    }
}



// Parse fr text data from REW or AudioTool format with whatever separator
function tsvParse(fr) {
    return fr.split(/[\r\n]/)
        .map(l => l.trim()).filter(l => l && l[0] !== '*')
        .map(l => l.split(/[\s,]+/).map(e => parseFloat(e)).slice(0, 2))
        .filter(t => !isNaN(t[0]) && !isNaN(t[1]));
}



// Apply stylesheet based layout options above
function setLayout() {
    function applyStylesheet(styleSheet) {
        var docHead = document.querySelector("head"),
            linkTag = document.createElement("link");
        
        linkTag.setAttribute("rel", "stylesheet");
        linkTag.setAttribute("type", "text/css");
        
        linkTag.setAttribute("href", styleSheet);
        docHead.append(linkTag);
    }

    if ( !alt_layout ) {
        applyStylesheet("style.css");
    } else {
        applyStylesheet("style-alt.css");
        applyStylesheet("style-alt-theme.css");
    }
}
setLayout();



// Set restricted mode
function setRestricted() {
    if ( restricted ) {
        max_compare = 2;
        restrict_target = false;
        disallow_target = true;
        premium_html = "<h2>You gonna pay for that?</h2><p>To use target curves, or more than two graphs, <a target='_blank' href='https://crinacle.com/wp-login.php?action=register'>subscribe</a> or upgrade to Patreon <a target='_blank' href='https://www.patreon.com/join/crinacle/checkout?rid=3775534'>Silver tier</a> and switch to <a target='_blank' href='https://crinacle.com/graphs/iems/graphtool/premium/'>the premium tool</a>.</p>";
    }
}
setRestricted();



// Configure HTML accessories to appear at the bottom of the page. Displayed only if accessories (above) is true
// There are a few templates here for ease of use / examples, but these variables accept any HTML
const 
    // Short text, center-aligned, useful for a little side info, credits, links to measurement setup, etc. 
    simpleAbout = `
        <p class="center">This web software is based on the <a href="https://github.com/mlochbaum/CrinGraph">CrinGraph</a> open source software project.</p>
    `,
    // Slightly different presentation to make more readable paragraphs. Useful for elaborated methodology, etc.
    paragraphs = `
        <h2>Viverra tellus in hac</h2>

        <p>Lorem ipsum dolor sit amet, <a href="">consectetur adipiscing elit</a>, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Quisque non tellus orci ac. Dictumst quisque sagittis purus sit amet volutpat consequat. Vitae nunc sed velit dignissim sodales ut. Faucibus ornare suspendisse sed nisi lacus sed viverra tellus in. Dignissim enim sit amet venenatis urna cursus eget nunc. Mi proin sed libero enim. Ut sem viverra aliquet eget sit amet. Integer enim neque volutpat ac tincidunt vitae. Tincidunt nunc pulvinar sapien et ligula ullamcorper malesuada. Mauris rhoncus aenean vel elit scelerisque mauris pellentesque. Lacus luctus accumsan tortor posuere ac ut consequat semper. Non pulvinar neque laoreet suspendisse interdum consectetur libero id faucibus. Aliquam sem et tortor consequat id. Cursus sit amet dictum sit amet justo donec. Donec adipiscing tristique risus nec feugiat in fermentum posuere.</p>

        <p>Diam donec adipiscing tristique risus nec. Amet nisl purus in mollis. Et malesuada fames ac turpis egestas maecenas pharetra. Ante metus dictum at tempor commodo ullamcorper a. Dui id ornare arcu odio ut sem nulla. Ut pharetra sit amet aliquam id diam maecenas. Scelerisque in dictum non consectetur a erat nam at. In ante metus dictum at tempor. Eget nulla facilisi etiam dignissim diam quis enim lobortis scelerisque. Euismod nisi porta lorem mollis aliquam ut porttitor leo a. Malesuada proin libero nunc consequat interdum. Turpis egestas sed tempus urna et pharetra pharetra massa massa. Quis blandit turpis cursus in hac habitasse. Amet commodo nulla facilisi nullam vehicula ipsum a.</p>

        <p>Mauris ultrices eros in cursus turpis massa tincidunt. Aliquam ut porttitor leo a diam sollicitudin. Curabitur vitae nunc sed velit. Cursus metus aliquam eleifend mi in nulla posuere sollicitudin. Lectus nulla at volutpat diam ut. Nibh nisl condimentum id venenatis a condimentum vitae sapien. Tincidunt id aliquet risus feugiat in ante metus. Elementum nibh tellus molestie nunc non blandit massa enim. Ac tortor vitae purus faucibus ornare suspendisse. Pellentesque sit amet porttitor eget. Commodo quis imperdiet massa tincidunt. Nunc sed id semper risus in hendrerit gravida. Proin nibh nisl condimentum id venenatis a condimentum. Tortor at risus viverra adipiscing at in. Pharetra massa massa ultricies mi quis hendrerit dolor. Tempor id eu nisl nunc mi ipsum faucibus vitae.</p>

        <h2>Tellus orci</h2>

        <p>Viverra mauris in aliquam sem. Viverra tellus in hac habitasse platea. Facilisi nullam vehicula ipsum a arcu cursus. Nunc sed augue lacus viverra vitae congue eu. Pretium fusce id velit ut tortor pretium viverra suspendisse. Eu scelerisque felis imperdiet proin. Tincidunt arcu non sodales neque sodales ut etiam sit amet. Tellus at urna condimentum mattis pellentesque. Congue nisi vitae suscipit tellus. Ut morbi tincidunt augue interdum.</p>

        <p>Scelerisque in dictum non consectetur a. Elit pellentesque habitant morbi tristique senectus et. Nulla aliquet enim tortor at auctor urna nunc id. In ornare quam viverra orci. Auctor eu augue ut lectus arcu bibendum at varius vel. In cursus turpis massa tincidunt dui ut ornare lectus. Accumsan in nisl nisi scelerisque eu ultrices vitae auctor eu. A diam sollicitudin tempor id. Tellus mauris a diam maecenas sed enim ut sem. Pellentesque id nibh tortor id aliquet lectus proin. Fermentum et sollicitudin ac orci phasellus. Dolor morbi non arcu risus quis. Bibendum enim facilisis gravida neque. Tellus in metus vulputate eu scelerisque felis. Integer malesuada nunc vel risus commodo. Lacus laoreet non curabitur gravida arcu.</p>
    `,
    // Customize the count of widget divs, and customize the contents of them. As long as they're wrapped in the widget div, they should auto-wrap and maintain margins between themselves
    widgets = `
        <div class="accessories-widgets">
            <div class="widget">
                <a href="https://www.youtube.com/channel/UCIw1An1OUp4XIv_h6si2etQ"><img width="200" src="youtube.png"/></a>
            </div>

            <div class="widget">
                <a href="https://docs.google.com/spreadsheets/d/1TH9_bqUq1vANsFiXVbVZ6w8kVA9C3DkknnMGyIcKE7M/edit#gid=0"><img width="200" src="top10.png"/></a>
            </div>

            <div class="widget">
                <a href="https://twitter.com/HawaiibadboyB"><img width="200" src="twitter.png"/></a>
            </div>
        </div>

        <p class="center">(More coming soon.)</p>
    `,
    // Which of the above variables to actually insert into the page
    whichAccessoriesToUse = widgets;



// Configure external links to appear at the bottom of the page. Displayed only if externalLinksBar (above) is true
const linkSets = [
    {
        label: "IEM graph databases",
        links: [
            {
                name: "Audio Discourse",
                url: "https://iems.audiodiscourse.com/"
            },
            {
                name: "Bad Guy",
                url: "https://hbb.squig.link/"
            },
            {
                name: "Super* Review",
                url: "https://squig.link/"
            },
            {
                name: "RikudouGoku",
                url: "https://rg.squig.link/"
            },
        ]
    },
    {
        label: "Helpful stuff",
        links: [
            {
                name: "Interactive response chart",
                url: "https://alexiy.nl/eq_chart/"
            },
            {
                name: "Twitter",
                url: "https://twitter.com/HawaiibadboyB"
            },
            {
                name: "INSTAGRAM",
                url: "https://www.instagram.com/hawaiibadboyz/"
            }
        ]
    }
];




// Set up analytics
function setupGraphAnalytics() {
    if ( analyticsEnabled ) {
        const pageHead = document.querySelector("head"),
              graphAnalytics = document.createElement("script"),
              graphAnalyticsSrc = "graphAnalytics.js";
        
        graphAnalytics.setAttribute("src", graphAnalyticsSrc);
        pageHead.append(graphAnalytics);
    }
}
setupGraphAnalytics();



// If alt_header is enabled, these are the items added to the header
let headerLogoText = "",
    headerLogoImgUrl = "https://squig.link/squiglink-logo-w.png",
    headerLinks = [
    {
        name: "Top 10 List",
        url: "https://docs.google.com/spreadsheets/d/1TH9_bqUq1vANsFiXVbVZ6w8kVA9C3DkknnMGyIcKE7M/edit#gid=0"
    },
    {
        name: "YouTube",
        url: "https://www.youtube.com/channel/UCIw1An1OUp4XIv_h6si2etQ"
    },
    {
        name: "Twitter",
        url: "https://twitter.com/HawaiibadboyB"
    }
];


// Tutorial definitions
let tutorialDefinitions = [
    {
        name: 'Sub bass',
        width: '16%',
        description: '(Sub bass description coming soon.)'
    },
    {
        name: 'Mid bass',
        width: '24%',
        description: '(Mid bass description coming soon.)'
    },
    {
        name: 'Mids',
        width: '27%',
        description: '(Mids description coming soon.)'
    },
    {
        name: 'Upper mids / Treble',
        width: "33%",
        description: '(Upper mids / Treble description coming soon.)'
    }
];