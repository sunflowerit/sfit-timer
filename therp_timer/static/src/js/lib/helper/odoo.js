/* 
Basic helper library to handle Odoo API requests based on the
browser fetch API i.e fetch(resource, options) 
see https://developer.mozilla.org/en-US/docs/Web/API/fetch
*/

/* NB: If you're using odoo v7.0 to v8.0 they return session_id 
       which needs to be saved and sent with request to authenticate. 
       This library doesn't support this. Odoo v14.0 onwards use 
       'HttpOnly' attribute of an HTTP cookie. This attribute instructs 
       the browser that the cookie should not be accessible via 
       client-side scripts (such as JavaScript). The cookie is 
       limited to being sent only through HTTP requests. To by pass this,
       you may need to design a prefetch function that can save the cookie
       and then use it in you requests.
*/

var Odoojs = (function () {
  return {
    // Stardard object variables for support on Odoo API requests
    odooRpc: {
      odoo_server_url: "", // main odoo instance URL
      // Fetch API options parameter
      fetch_params: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        redirect: "manual" // handle odoo redirects manually
      },
      is_session_active: false,
      context: { lang: "en_EN" }, // odoo context
      uid: null,
      username: "",
      server_version: "",
      server_version_info: [],
      partner_id: false,
      database: "",
      user: "",
      company_info: {},
      supports_http_only_requests: false,
      unsupported_versions: [7.0, 8.0],
    },
    // Set and save defaults for active sessions
    saveActiveSessionDetails: function (info) {
      Odoojs.odooRpc.odoo_request_data = info;
      Odoojs.odooRpc.context = info["user_context"];
      Odoojs.odooRpc.odoo_server_url = info["web.base.url"];
      Odoojs.odooRpc.username = info["username"];
      Odoojs.odooRpc.uid = info["uid"];
      Odoojs.odooRpc.server_version = info["server_version"];
      Odoojs.odooRpc.server_version_info = info["server_version_info"];
      Odoojs.odooRpc.partner_id = info["partner_id"];
      Odoojs.odooRpc.user = info["name"];
      Odoojs.odooRpc.database = info["db"];
      Odoojs.odooRpc.company_info = info["user_companies"];
      Odoojs.odooRpc.is_session_active = true;
      storage.getItem("active_sessions", (sessions) => {
        if (sessions && sessions.length) {
          Odoojs.odooRpc.session_no = sessions.length + 1;
          storage.setItem(
            "active_sessions",
            sessions.push(JSON.stringify(Odoojs.odooRpc))
          );
        } else {
          Odoojs.odooRpc.session_no = 1;
          storage.setItem('active_sessions', [JSON.stringify(Odoojs.odooRpc)]);
        }
      });
    },
    // Login to Odoo
    login: function (db, login, password) {
      var params = {
        db: db,
        login: login,
        password: password,
      };
      return Odoojs.sendRequest("/web/session/authenticate", params);
    },
    // Logout of Odoo
    logout: function () {
      let param_to_remove = ["body", "headers"];
      // Using destructuring exclude specified keys
      let {
        [param_to_remove[0]]: _,
        [param_to_remove[1]]: __,
        ...new_fetch_params
      } = Odoojs.odooRpc.fetch_params;
      Odoojs.odooRpc.fetch_params = new_fetch_params;
      Odoojs.odooRpc.fetch_params.method = "GET";
      return Odoojs.sendRequest("/web/session/logout", {}, (type = "http"));
    },
    // Search Read
    searchRead: function (model, domain, fields) {
      var params = {
        model: model,
        domain: domain,
        fields: fields,
      };
      return Odoojs.sendRequest("/web/dataset/search_read", params);
    },
    // Fetch Odoo session Info
    getSessionInfo: function (model, method, args, kwargs) {
      return Odoojs.sendRequest("/web/session/get_session_info", {});
    },
    // Fetch Odoo server info
    getServerInfo: function (model, method, args, kwargs) {
      return Odoojs.sendRequest("/web/webclient/version_info", {});
    },
    // Fetch db list
    getDbList: function () {
      return Odoojs.sendRequest("/web/database/list", {});
    },
    // Handle server-side actions associated with buttons in Odoo's web interface
    call_kw: function (model, method, args, kwargs) {
      kwargs = kwargs || {};
      kwargs.context = kwargs.context || {};
      kwargs["context"] = Object.assign(
        {},
        kwargs.context,
        Odoojs.odooRpc.context
      );

      var params = {
        model: model,
        method: method,
        args: args,
        kwargs: kwargs,
      };
      return Odoojs.sendRequest("/web/dataset/call_kw", params);
    },
    // Call button function
    call_btn: function (model, method, args, kwargs) {
      kwargs = kwargs || {};
      kwargs.context = kwargs.context || {};
      kwargs["context"] = Object.assign(
        {},
        kwargs.context,
        Odoojs.odooRpc.context
      );

      var params = {
        model: model,
        method: method,
        args: args,
        kwargs: kwargs,
      };
      return Odoojs.sendRequest("/web/dataset/call_button", params);
    },
    /* This can be combined in the sendRequest function to check if support of api
       is only based on higher odoo versions using httpOnly attributes for cookies.
       For Now its assumed the use case will be on higher version of odoo v14+ 
    */

    checkCookieSupport: async function (url, params) {
      let res = await Odoojs.sendRequest("/web/webclient/version_info", {});
      if (res && "is_error" in res && !res["is_error"]) {
        if (
          Odoojs.odooRpc.unsupported_versions.includes(
            parseFloat(res.result.server_serie)
          )
        ) {
          throw new Error(
            `This Odoo js lib doesn't support version ${res.result}.`
          );
        } else {
          Odoojs.odooRpc.supports_http_only_requests = true;
        }
      }
    },

    // Main request function
    // TODO: create a prefetch call that will be called internally.
    sendRequest: function (url, params, type = "json") {
      if (type === "json") {
        let json_data = {
          jsonrpc: "2.0",
          method: "call",
          params: params, //payload
        };
        Odoojs.odooRpc.fetch_params["method"] = "POST";
        Odoojs.odooRpc.fetch_params.headers = {
          "Content-Type": "application/json",
        };
        // Build the json request based on fetch() API func call
        Odoojs.odooRpc.fetch_params.body = JSON.stringify(json_data);
      }

      // Fetch API supports two parameters resource i.e url and options
      // In this case we pass odoo url and parametrs for request
      let request_url = Odoojs.odooRpc.odoo_server_url + url;
      let request_fetch_params = Odoojs.odooRpc.fetch_params;

      return new Promise((resolve, reject) => {
        fetch(request_url, request_fetch_params)
          .then((response) => {
            if (!response.ok) {
              let error_res = JSON.stringify(response);
              if (response.type === "opaqueredirect") {
                throw new Error(`Opaqueredirect response encountered from
                 ${response.url}: ${error_res}.
                 Last api call redirects you to a url which is not 
                 currently allowed`);
              }
              throw new Error(
                `HTTP error! Status: ${response.status}\nMore info: ${error_res}`
              );
            }
            return response.json();
          })
          .then((data) => {
            let result = {
              is_error: null,
              error_title: "",
              error_message: "",
              error: "",
              error_exception: "",
              result: data,
            };
            // Successfull Odoo API request
            if (data && "result" in data) {
              result["is_error"] = false;
              result["result"] = data["result"];
            }
            // When Odoo error occurs
            if (data && "error" in data) {
              result["is_error"] = true;
              result["error_message"] = data["error"]["data"]["message"];
              result["error_title"] = data["error"]["message"];
              result["error"] = data["error"]["data"]["debug"];
              result["error_exception"] = data["error"]["data"]["name"];
              result["result"] = data;
            }
            resolve(result);
          })
          .catch((error) => {
            let error_info = {
              is_error: true,
              error_title: "",
              error_message: "",
              error: error["message"],
              error_exception: error["stack"],
              result: error,
            };
            // Failed to fetch
            if (
              error instanceof TypeError ||
              error.message === "Failed to fetch"
            ) {
              error_info["error_title"] = "Network Error";
              error_info["error_message"] =
                "Please check your network connection or if Odoo host server is running,\nthen trying again";
            }
            // Handle any error returned
            // error from redirect, e.g you selected logout

            reject(error_info);
          });
      });
    },
  };
})();

// Set your default for testing in dev tools only
Odoojs.odooRpc.odoo_server_url = "http://localhost:8099";

// Check if Odoo instance URL is set
if (!Odoojs.odooRpc.odoo_server_url) {
  console.error(
    `You need to set an Odoo instance server URL to continue, otherwise expect errors`
  );
}

// Call to set the 'supports_http_only_requests' variable
// NB: prefetch flight function in sendRequests is better.
Odoojs.checkCookieSupport().catch((error) => {
  console.log(error);
});
