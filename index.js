const express = require('express');
const fs = require('fs');
const cors = require('cors');

const PORT= 3000;
const DATA_FILE = 'data.json';

const app = express();
app.use(cors()); 
app.use(express.json())

app.get('/api/publishers', async (req,res) =>{
    try {
        const data = await loadData();
        res.json(data);
    } catch (error) {
        console.error('Error while fetching publishers:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.get('/api/domains', async (req,res) =>{
    try{
        const data = await loadData();
        let domainsList =[];
        data.publishers?.forEach((publisher)=>{
            publisher.domains?.forEach((domain)=>{
                domainsList.push(domain)
            })
        })
        res.json({domains: domainsList});
    }
    catch(error){
        console.error('Error while fetching domains:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

 app.post('/api/domains',async (req,res) =>{
    try{
    const dataObject = await loadData(); 

    const newDomain = req.body?.newDomain; //the domain data from angular
    const newPublisherName = req.body?.newPublisherName;

    const publishers = dataObject.publishers;

     for (const publisher of publishers){
        if(publisher.domains?.find((domainName) => domainName.domain === newDomain.domain)){
           return res.status(400).json({ message: `This domain already exist for publisher ${publisher.publisher}` });
        }
      }
      
      const publisher = publishers.find((p)=> p.publisher === newPublisherName)
      if(publisher){
        publisher.domains.push(newDomain);
      }
      else{
        publishers[publishers.length-1].domains.push(newDomain)
      }
      await saveData(dataObject);
     res.json({ success: true, dataObject });
    } catch(error){
        console.error('Error while adding domain:', error);
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

  app.put('/api/domains/:domain', async (req,res) =>{
    const {domain} = req.params;
    const updatedDomain = req.body;
    const dataObject = await loadData(); 
    const publishers = dataObject.publishers

    let domainToUpdate;

    for (const publisher of publishers){
        try{
            domainToUpdate = publisher.domains?.find((domainName) => domainName.domain === domain)
            if(domainToUpdate){
                domainToUpdate.domain = updatedDomain.domain
                domainToUpdate.desktopAds = updatedDomain.desktopAds
                domainToUpdate.mobileAds = updatedDomain.mobileAds
                await saveData(dataObject);
                return res.json({ success: true, dataObject });
            }
            return res.status(404).json({ error: 'Domain not found' });
     
        }catch(error){
            console.error('Error while updating domain:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});


 app.delete('/api/domains/:domain', async (req,res) =>{
    try{
        const {domain} = req.params
        const dataObject = await loadData(); 
        const publishers = dataObject.publishers

        for (const publisher of publishers) {
            const index = publisher.domains?.findIndex((domainName) => domainName.domain === domain);

            if (index !== -1) {
                publisher.domains?.splice(index, 1);
                await saveData(dataObject);
                return res.json({ success: true, dataObject });
            }
        }
        
        return res.status(404).json({ error: 'Domain not found' });
    }catch(error){
        console.error('Error while deleting domain:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

})

const saveData = async (data) => {
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(data));
}

const loadData = async () => {
    const dataBuffer = await fs.promises.readFile(DATA_FILE,'utf-8');
    const dataString = dataBuffer.toString();
    return JSON.parse(dataString);
}

app.listen(PORT, ()=> console.log(`listen on http://localhost:${PORT}`))

