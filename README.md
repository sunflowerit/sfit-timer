### Odoo Timer Browser extension

Odoo Timer is a Chromium/Firefox browser extension app used to log work hours
and automatically write them to **Odoo Timesheets**.

It connects to an Odoo instance of your choice and displays issue/task
list from any accessible projects. One can start timer based on the issue, pause and end time of the issue thus recording a new billable
timesheet line record in the timesheets.

Features:

* Support for both issue/task list from projects.
* Start/Pause/Stop issue/task timer.
* Create odoo timesheet line record linked to analytic account.
* Add and configure a Remote host.
* Remove existing remotes.
* Switch from existing Remotes.
* Show an individuals issues/tasks or all.


Usage
=============
Pull latest from `git clone git@github.com:therp/odoo-timer.git` then manually
load to your browser see below steps for Chrome and Firefox.

Chrome
-------
1. Browse to [chrome://extensions/](chrome://extensions/)
2. Select 'load unpacked' and point to the 'src' folder.
3. The app will now appear in the top-right of your Chrome browser.

Opera
------
1. Go to Opera Settings probably left sidebar `...`
2. Click on `Extensions`
3. Select `load unpacked` and point to the 'src' folder.
4. The app will now appear in the top-right of Opera after pin it.

Firefox
-------
1. Download the signed XPI package from "Releases" page.
2. Load the addon.
3. The app will now appear in the top-right of your Firefox browser

Configuration
-------------

* When you clicking on the Odoo Timer button in Chrome for the first time, the log in screen comes up.
* Uncheck the 'Use Default Host' box at the buttom, and use the correct URL and database name.
* For Username and Password, use your regular Odoo login info.

How it works
------------

![How Odoo timer app works](src/img/usage.gif "How it Works")

* After logging in, a list of your active issues will show up.
* Use the green buttons to start and stop working on an issue. It will automatically show up on your Timesheet
* Time worked is rounded up or down to the nearest 15 minutes, this so we can keep our invoicing nice and clean.
* Tick 'all' to have other people's issue show up in this list as well; useful for multidev tasks!
* Under 'options' there's a switch to write time on ''tasks'' instead of ''issues'', we'll be using this in the future :)

Update
------

1. `cd /path/to/odoo-timer`
2. `git pull origin branch`
3. update on *chrome://extensions*
4. update on *about:debugging#/runtime/this-firefox*
