var BCLS = (function (window, document) {
  var account_id,
    account_id_default = "1485884786001",
    client_id,
    client_secret,
    // api stuff
    proxyURL =
      "https://solutions.brightcove.com/bcls/bcls-proxy/bcls-proxy-v2.php",
    baseURL = "https://social.api.brightcove.com/v1/accounts/",
    // element references
    account_id_input = document.getElementById("account_id_input"),
    client_id_input = document.getElementById("client_id_input"),
    client_secret_input = document.getElementById("client_secret_input"),
    makeMap = document.getElementById("makeMap"),
    logger = document.getElementById("logger"),
    apiRequest = document.getElementById("apiRequest"),
    feedDisplay = document.getElementById("feedDisplay");

  /**
   * tests for all the ways a variable might be undefined or not have a value
   * @param {String|Number} x the variable to test
   * @return {Boolean} true if variable is defined and has a value
   */
  function isDefined(x) {
    if (x === "" || x === null || x === undefined) {
      return false;
    }
    return true;
  }
  /**
   * disables all buttons so user can't submit new request until current one finishes
   * @param {htmlElement} b reference to the button
   */
  function disableButton(b) {
    b.classList.add("disabled");
    b.setAttribute("disabled", "disabled");
  }

  /**
   * enable a button
   * @param   {htmlElement}  b  reference to the button
   */
  function enableButton(b) {
    b.classList.remove("disabled");
    b.removeAttribute("disabled");
  }

  /**
   * addItems
   * @param   {responseURL}  syndicationUrl  reference to the API response
   */
  function addItems(syndicationUrl) {
    fetch(syndicationUrl).then((r) => {
      r.text().then((d) => {
        let CONTENT = d;
        logger.textContent = "Finished!";
        feedDisplay.textContent = CONTENT;
        enableButton(makeMap);
      });
    });
  }

  /**
   * sets up the data for the API request
   * @param {String} id the id of the button that was clicked
   */
  function createRequest(id) {
    var endPoint = "",
      options = {},
      parsedData;
    // disable buttons to prevent a new request before current one finishes
    disableButton(makeMap);
    // options data
    options.requestBody = JSON.stringify({
      name: "Video Sitemap",
      type: "Google",
      include_all_content: true,
      fetch_sources: true,
      content_type_header: "application/xml"
    });
    options.proxyURL = proxyURL;
    options.account_id = account_id;
    if (isDefined(client_id) && isDefined(client_secret)) {
      options.client_id = client_id;
      options.client_secret = client_secret;
    }

    switch (id) {
      case "getVideos":
        endPoint = account_id + "/mrss/syndications";
        options.url = baseURL + endPoint;
        options.requestType = "POST";
        apiRequest.textContent = options.url;
        makeRequest(options, function (response) {
          parsedData = JSON.parse(response);
          addItems(parsedData.syndication_url);
        });
        break;
    }
  }

  /**
   * send API request to the proxy
   * @param  {Object} options for the request
   * @param  {String} options.url the full API request URL
   * @param  {String='GET','POST','PATCH','PUT','DELETE'} requestData [options.requestType='GET'] HTTP type for the request
   * @param  {String} options.proxyURL proxyURL to send the request to
   * @param  {String} options.client_id client id for the account (default is in the proxy)
   * @param  {String} options.client_secret client secret for the account (default is in the proxy)
   * @param  {JSON} [options.requestBody] Data to be sent in the request body in the form of a JSON string
   * @param  {Function} [callback] callback function that will process the response
   */
  function makeRequest(options, callback) {
    var httpRequest = new XMLHttpRequest(),
      response,
      proxyURL = options.proxyURL,
      // response handler
      getResponse = function () {
        try {
          if (httpRequest.readyState === 4) {
            if (httpRequest.status >= 200 && httpRequest.status < 300) {
              response = httpRequest.responseText;
              // some API requests return '{null}' for empty responses - breaks JSON.parse
              if (response === "{null}") {
                response = null;
              }
              // return the response
              callback(response);
            } else {
              alert(
                "There was a problem with the request. Request returned " +
                  httpRequest.status
              );
            }
          }
        } catch (e) {
          alert("Caught Exception: " + e);
        }
      };
    /**
     * set up request data
     * the proxy used here takes the following request body:
     * JSON.stringify(options)
     */
    // set response handler
    httpRequest.onreadystatechange = getResponse;
    // open the request
    httpRequest.open("POST", proxyURL);
    // set headers if there is a set header line, remove it
    // open and send request
    httpRequest.send(JSON.stringify(options));
  }

  function init() {
    // event handlers
    makeMap.addEventListener("click", function () {
      // get the inputs
      client_id = client_id_input.value;
      client_secret = client_secret_input.value;
      // only use entered account id if client id and secret are entered also
      if (isDefined(client_id) && isDefined(client_secret)) {
        if (isDefined(account_id_input.value)) {
          account_id = account_id_input.value;
        } else {
          window.alert(
            "To use your own account, you must specify an account id, and client id, and a client secret - since at least one of these is missing, a sample account will be used"
          );
          client_id = "";
          client_secret = "";
          account_id = account_id_default;
        }
      } else {
        account_id = account_id_default;
      }

      // get count of videos, then we'll adjust to see how many we need to get
      createRequest("getVideos");
    });
    feedDisplay.addEventListener("click", function () {
      feedDisplay.select();
    });
  }

  init();
})(window, document);
