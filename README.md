### Plans réseau Add-In
This Excel Add-In should allow you to more easily create radio connection plans (for example created from a template using https://github.com/sebug/plans-reseau-wizard ).

The goal is to have something that takes your Excel file and then allows you to

 * easily switch the connection group used
 * make card-sized plans for the people using them in the field

Like the wizard one, this one will be Azure Functions based, it's just that then we can sideload it in Excel online (or desktop for that matter).


	az group create --name reseauAddInGroup --location westeurope
	az storage account create --name storageplansreseauaddin --location westeurope --resource-group reseauAddInGroup --sku Standard_LRS
	az functionapp create --name ReseauAddIn --storage-account storageplansreseauaddin --resource-group reseauAddInGroup --consumption-plan-location westeurope

Then I had to set up Continuous Deployment (from the Azure function deployment options). No API way for that yet, apparently.


	az storage container create --name addinstatic
	az storage blob upload --container-name addinstatic --file clientside/index.html --name index.html --content-type "text/html"
	az storage container set-permission --name addinstatic --public-access blob
	az storage blob upload --container-name addinstatic --file clientside/dist.js --name dist.js --content-type "application/javascript"
	az storage blob upload --container-name addinstatic --file clientside/polyfill.min.js --name polyfill.min.js --content-type "application/javascript"
	az storage blob upload --container-name addinstatic --file clientside/app_icon.png --name app_icon.png --content-type "image/png"
	az storage blob upload --container-name addinstatic --file clientside/Jquery.Dropdown.js --name Jquery.Dropdown.js --content-type "application/javascript"


The Add-in entry point then is on https://storageplansreseauaddin.blob.core.windows.net/addinstatic/index.html


As for login, here are the steps I took to get that working (modeled by https://blogs.msdn.microsoft.com/hmahrt/2017/03/07/azure-active-directory-b2c-and-azure-functions/ ):

- The function base path is https://reseauaddin.azurewebsites.net

Connect to Azure B2C (separate account in my case).

Add an application.




