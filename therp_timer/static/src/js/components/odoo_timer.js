(function (exports) {
  const { Component, useRef, useState, onWillStart } = owl;
  const { get_template, checkDupRemotes, validURL } = HelperFuncs;

  // Timer app component and its functionality
  class OdooTimerComponent extends Component {
    static template = get_template("../../templates/odoo_timer.xml");

    setup() {
      let self = this;
      this.state = useState({
        activeSection: "TimerSpinnerSection",
        activeTab: "configForm",
        hosts_list: [],
        active_sessions: [],
        can_view_host_table: false,
        current_logged_in_host_details: {},
        existingSession: false,
      });
      this.user_email = useRef("odoo_user_email");
      this.user_password = useRef("odoo_user_password");
      this.user_instance = useRef("odoo_user_instance");
      this.existingSession = useRef("odoo_existing_session");
      this.odoo_host = useRef("odoo_host");
      this.odoo_instance_name = useRef("odoo_instance_name");
      this.odoo_database = useRef("odoo_database");
      this.odoo_instance_logo = useRef("odoo_instance_logo");

      onWillStart(() => {
        // First: Check if there is a list of configured Odoo host instances
        // and configure them
        storage.getItem("remote_host_info", function (remotes) {
          if (remotes && remotes.length) {
            let remote_lst = [];
            for (let remote of remotes) {
              remote_lst.push(JSON.parse(remote));
            }
            self.state.hosts_list = remote_lst;
            /* Second: Check if session was set up through login
               NB: Our timer shares a session with any active session 
                   related to the browser, however remember that it wasn't 
                   through timer login so a call to getSessionInfo(), 
                   passes our shared cookie as sid
                   instead of the user's uid. 
            */
            storage.getItem('active_sessions' , (sessions) => {
              let active_sessions = [];
              if (sessions && sessions.length) {
                for (let session of sessions) {
                  active_sessions.push(JSON.parse(session));
                }
                // Todo: check if there is an active session and login directly to tasks.
                // self.state.active_sessions = active_sessions;
                // let listItems = active_sessions.map(ses => `<li>${ses['instance']}</li>`).join('');
                // self.state.existingSession = true;
                // alertAwesome.show("Notification", `${active_sessions.length} found:<ul>${listItems}</ul><br/>Select one and click on login`);
                self.state.activeSection = "TimerLoginSection";
              }
              else{
                alertAwesome.show("Notification", "No active sessions found, Please login to continue");
                self.state.activeSection = "TimerLoginSection";
              }

            })
          } else self.state.activeSection = "TimerLoginSection";
        });
      });
    }

    toggleRequiredInputBorders(container) {
      let requiredInputs = container.querySelectorAll("input[required]");
      requiredInputs.forEach(function (input) {
        if (!input.value) {
          let label = document.querySelector(`label[for="${input.id}"]`);
          input.style.border = "1px solid red"; // Set red border for empty required inputs
          alertAwesome.show('Input Required', `Input required for field <b>${label.textContent}</b>`);
          return false;
        } else {
          input.style.border = ""; // Reset the border if value is present
        }
      });
      return true;
    }

    login() {
      let self = this;
      let login_container = document.querySelector('.login-form');
      if (self.toggleRequiredInputBorders(login_container)) {
        let username = this.user_email.el.value;
        let password = this.user_password.el.value;
        let selectedIndex = this.user_instance.el.selectedIndex;
        let selectedOption = this.user_instance.el.options[selectedIndex];
        let host_info = selectedOption.dataset;

        Odoojs.login(host_info['db'], username, password).then((res)=>{
          let r = self.handleResponse(res);
          if (r) {
            Odoojs.odooRpc.host_details = host_info;
            // save the session details
            Odoojs.saveActiveSessionDetails(res);
            self.state.current_logged_in_host_details = host_info;
            self.state.activeSection = 'TimerTasksSection';
          }
        }).catch((error)=>{
          self.handleResponse(error)
        });
      }
      
    }

    continueSession () {

    }

    // Function to toggle sidebar and close button
    toggleSidebar() {
      this.hideHostTable();
      const sidebar = document.getElementById("mySidenav");
      const closeBtn = document.querySelector(".closebtn"); // Select the close button by class

      if (sidebar && closeBtn) {
        sidebar.classList.toggle("sidebar-open");
        closeBtn.classList.toggle("active");

        if (sidebar.classList.contains("sidebar-open")) {
          closeBtn.style.display = "block"; // Show close button when sidebar is open
        } else {
          closeBtn.style.display = "none"; // Hide close button when sidebar is closed
        }
      } else {
        console.error("Sidebar or close button not found.");
      }
    }

    async getStoredHostsInfo() {
      let self = this;
      let remotes = await browser.storage.local.get("remote_host_info");
      if (remotes && remotes.length) {
        let remote_lst = [];
        for (let remote of remotes) {
          remote_lst.push(JSON.parse(remote));
        }
        self.state.hosts_list = remote_lst;
      }
    }

    hideHostTable() {
      this.state.can_view_host_table = false;
    }

    removeSelectHostDetails(ev) {
      this.getStoredHostsInfo();
      let hosts = this.state.hosts_list;
      let parent_ele = ev.target.parentElement;
      let id = parseInt(parent_ele.id);
      let host = parent_ele.dataset["remote"];
      if (hosts.length) {
        let updated_remotes = hosts.filter((x) => x.id !== id);
        let new_remotes = [];
        updated_remotes.forEach((x) => {
          new_remotes.push(JSON.stringify(x));
        });
        storage.setItem("remote_host_info", new_remotes);
        this.getStoredHostsInfo();
        return alertAwesome.show(
          `Success`,
          `[${host}] has been removed successfully!`
        );
      }
    }

    removeHostDetails() {
      this.hideHostTable();
      storage.removeItem("remote_host_info");
      this.state.host_list = [];
      return alertAwesome.show("Success", "Host list deleted successfully!");
    }

    addHostDetails() {
      // Hide table if visible
      this.hideHostTable();

      let self = this;
      let host_url = this.odoo_host.el.value;
      let host_instance = this.odoo_instance_name.el.value;
      let host_database = this.odoo_database.el.value;
      let host_instance_logo = this.odoo_instance_logo.el.src;
      if (!(host_url || host_instance || host_database || host_instance_logo))
        return alertAwesome.show(
          "Error",
          "Fields cannot be empty, you need to add host, instance and database inputs"
        );
      let hostdetails = {
        host: host_url,
        instance: host_instance,
        database: host_database,
        logo: host_instance_logo,
      };
      // Check existing remotes
      storage.getItem("remote_host_info", function (remotes) {
        // Check if url is valid for storage.
        if (validURL(host_url)) {
          if (remotes && remotes.length) {
            // Check if a duplicate remote already exists
            if (checkDupRemotes(hostdetails, remotes))
              return alertAwesome.show(
                `Error`,
                `${hostdetails.host} and ${hostdetails.database} already exist no duplicates allowed`
              );
            else {
              // Add new remote
              hostdetails.id = remotes.length + 1;
              remotes.push(JSON.stringify(hostdetails));
              // store new updated list of remotes
              storage.setItem("remote_host_info", remotes);
              alertAwesome.show(
                `Success`,
                `Host [${hostdetails.host}] added to the list Successfully. Logout to check`
              );
            }
          } else {
            // Create a new Remote if cache/storage cleared.
            hostdetails.id = 1;
            let remotes_lst = [JSON.stringify(hostdetails)];
            storage.setItem("remote_host_info", remotes_lst);
            alertAwesome.show(
              `Success`,
              `Host [${hostdetails.host}] " created successfully. Logout to check`
            );
          }
          // update list after adding
          self.getStoredHostsInfo();

          // clear fields
          self.odoo_host.el.value = "";
          self.odoo_database.el.value = "";
          self.odoo_instance_name.el.value = "";
        } else {
          alertAwesome.show("Error", "Invalid URL syntax");
        }
      });
    }

    uploadLogo(ev) {
      ev.preventDefault(); // Prevent event from propagating
      let self = this;
      const logo = ev.target.files[0];
      if (logo) {
        const reader = new FileReader();
        reader.onload = function (readerEvent) {
          readerEvent.preventDefault();
          const imageData = readerEvent.target.result; // Base64 string
          // Save the Base64 image data to localStorage
          self.odoo_instance_logo.el.src = imageData;
          self.odoo_instance_logo.el.classList.remove("hide");
        };
        reader.readAsDataURL(logo); // Read the file as a data URL (Base64)
      }
    }

    viewStoredHostInfo() {
      let self = this;
      this.state.can_view_host_table = false;
      storage.getItem("remote_host_info", function (remotes) {
        if (remotes && remotes.length) {
          let remote_lst = [];
          for (let remote of remotes) {
            remote_lst.push(JSON.parse(remote));
          }
          self.state.hosts_list = remote_lst;
          self.state.can_view_host_table = true;
        } else {
          alertAwesome.show(
            "No Data",
            "Add remote hosts to store and view them"
          );
        }
      });
    }

    refreshHostList() {
      try {
        this.hideHostTable();
        this.getStoredHostsInfo();
      } catch (error) {
        console.log(`ERROR: ${error}`);
        return alertAwesome.show("Error", `${error}`);
      } finally {
        return alertAwesome.show(
          "Success",
          "Host List refreshed successfully!"
        );
      }
    }

    showNavBar() {
      document.getElementById("mySidenav").style.width = "160px";
      this.toggleSidebar();
    }

    closeNavBar() {
      document.getElementById("mySidenav").style.width = "0";
      this.toggleSidebar();
    }

    toggleActiveSection() {
      const activeSection = this.activeSection.el.id;
      this.state.activeSection = activeSection;
    }

    toggleActiveTab(ev) {
      this.state.activeTab = ev.target.id;
      this.closeNavBar();
    }

    handleResponse(response) {
      if (
        response["is_error"] &&
        (response["error_title"] == "Network Error" ||
        response["error_title"] == "Odoo Session Expired")
      )
        this.state.activeSection = "TimerLoginSection";
      if (response['is_error']) {
        alertAwesome.show(response["error_title"], response["error_message"]);
        return false;
      }
      return response['result'];
    }

    toggleActiveSection(ev) {
      const activeSection = ev.target.id;
      this.state.activeSection = activeSection;
    }
  }

  exports.OdooTimerComponent = OdooTimerComponent;
})((this.TimerAppComponent = this.TimerAppComponent || {}));
