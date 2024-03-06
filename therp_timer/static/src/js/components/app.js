(function () {
  /* Here we setup the Odoo timer component and configs needed */
  const { App } = owl;
  const { OdooTimerComponent } = TimerAppComponent;

  // Display version of Odoo OWL Lib
  console.log(`Timer using owl version: ${owl.__info__.version}`);

  // Odoojs.login('helpdesk', 'admin', 'admin').then((m)=>{console.log(m)})
  // Odoojs.call_kw('project.task', 'search_read', {}, {'domain':[], 'fields': ['id','name']}).then((p)=>{console.log(p)});
  // Odoojs.searchRead('project.task', [['name', 'ilike', '%inuka%']], ['id']).then((p)=>{console.log(p)})

  /* -------------------------------------------------------------------------
   *                          Setup Timer App
   * https://github.com/odoo/owl/blob/master/doc/reference/app.md#mount-helper
   * https://github.com/odoo/owl/blob/master/doc/reference/app.md#mount-helper
   * -------------------------------------------------------------------------*/

  // Setup the Odoo Timer App
  const OdootimerApp = new App(OdooTimerComponent);

  // Configurations
  const OdootimerConfig = {
    dev: true, // the application is rendered in dev mode;
  };

  // mount the timer App to view
  OdootimerApp.mount(document.body, OdootimerConfig);
})();
