### Plans réseau Add-In
This Excel Add-In should allow you to more easily create radio connection plans (for example created from a template using https://github.com/sebug/plans-reseau-wizard ).

The goal is to have something that takes your Excel file and then allows you to

 * easily switch the connection group used
 * make card-sized plans for the people using them in the field

Like the wizard one, this one will be Azure Functions based, it's just that then we can sideload it in Excel online (or desktop for that matter).


	az group create --name reseauAddInGroup --location westeurope
	az storage account create --name storageplansreseauaddin --location westeurope --resource-group reseauAddInGroup --sku Standard_LRS
	az functionapp create --name ReseauAddIn --storage-account storageplansreseauaddin --resource-group reseauAddInGroup --consumption-plan-location westeurope
