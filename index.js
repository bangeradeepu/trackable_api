
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());
app.use("/images", express.static(path.join(__dirname, "images")));

mongoose.connect('mongodb+srv://netstone360:aspire15@cluster0.phwldtn.mongodb.net/deepuDb?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const donationSchema = new mongoose.Schema({
  donatorName: String,
  createdAt: { type: Date, default: Date.now },
  donationAmount: Number,
});

const bankSchema = new mongoose.Schema({
  bankName:String,
  ifscCode:String,
  bankBranch:String,
  acNumber:Number,
  balance:Number,
  createdAt:{ type: Date, default: Date.now },
})

const organisationSchema = new mongoose.Schema({
  orgName : String,
  orgPno : Number,
  orgAddress : String,
  createdAt:{ type: Date, default: Date.now },
})

const spendsSchema = new mongoose.Schema({
  spendsName: String,
  spendsQuantity:Number,
  spendsType:String,
  spendsAmount:Number,
  spendsOccassion:String,
  createdAt: { type: Date, default: Date.now },
})
const memberSchema = new mongoose.Schema({
  memberName: String,
  memberRole: String,
  memberPhoneNumber: Number,
  memberAddress: String,
  memberImage: Buffer, // Store the image as buffer
  createdAt: { type: Date, default: Date.now },
});

const typeSchema = new mongoose.Schema({
  typeName:String,
  createdAt: { type: Date, default: Date.now },
})
const occassionsSchema = new mongoose.Schema({
  occassionName:String,
  createdAt: { type: Date, default: Date.now },
})
const memberRoleSchema = new mongoose.Schema({
  memberRoleCat:String,
  createdAt: { type: Date, default: Date.now },
})

const itemListSchema =mongoose.Schema({
  itemType:String,
  itemName:String,
  itemQty:Number,
  itemOccassion:String
})


const Donation = mongoose.model('Donation', donationSchema, 'donationDB');
const bankDetailsAdapter = mongoose.model('bank',bankSchema,'bankDetails');
const spendsAdapter = mongoose.model('spends',spendsSchema,'spendDB');
const memberAdapter = mongoose.model('memebrs',memberSchema,'membersDB');
const typeAdapter = mongoose.model('type',typeSchema,'typeDB');
const occasionsAdapter = mongoose.model('occasions',occassionsSchema,'occasionsDB');
const memberRoleAdapter = mongoose.model('memberRole',memberRoleSchema,'memberRoleDB');
const itemAdapter = mongoose.model('items',itemListSchema,'itemListDB');
const orgAdapter = mongoose.model('org',organisationSchema,'orgDB');

app.get('/api/getBankDetails', async(req,res) => {
  try {
    const bankData = await bankDetailsAdapter.find();
    res.status(200).json(bankData)
  } catch (error) {
    res.status(500).json(error);
  }
})
app.post('/api/postBankDetails', async(req,res) => {
  try {
    const {bankName,bankBranch,ifscCode,balance,acNumber} = req.body;
    const bankPost  = new bankDetailsAdapter({
      bankName:bankName,
      bankBranch:bankBranch,
      ifscCode:ifscCode,
      balance:balance,
      acNumber:acNumber
    });
    await bankPost.save();
    res.status(200).json(bankPost);
  } catch (error) {
    res.status(500).json(error);
  }
})
app.put('/api/putBankDetails/:id',async(req,res) => {
  try {
    const bankId = req.params.id;
    const {bankName,bankBranch,ifscCode,balance,acNumber} = req.body;
    const putbankBaalnce = await bankDetailsAdapter.findByIdAndUpdate(bankId,{
      bankName:bankName,
      bankBranch:bankBranch,
      ifscCode:ifscCode,
      balance:balance,
      acNumber:acNumber
    });
    res.status(200).json(putbankBaalnce);
  } catch (error) {
    res.status(500).json(error);
  }
});


app.get('/api/getOrg',async(req,res) => {
try {
  const getOrgData = await orgAdapter.find();
  res.status(200).json(getOrgData);
} catch (error) {
  res.status(500).json(error);
}
})
app.post('/api/postOrg',async(req,res) => {
  try {
    const {orgName,orgPno,orgAddress} = req.body;
    const postOrg = new orgAdapter({
      orgName:orgName,
      orgPno:orgPno,
      orgAddress:orgAddress
    });
    await postOrg.save();
    res.status(200).json(postOrg)
  } catch (error) {
    res.status(500).json(error);
  }
})
app.put('/api/putOrg/:id',async(req,res) => {
  try {
    const orgId = req.params.id;
    const {orgName,orgAddress,orgPno} = req.body;
    const putOrgData = await orgAdapter.findByIdAndUpdate(orgId,{
      orgName:orgName,
      orgAddress:orgAddress,
      orgPno:orgPno
    })
    res.status(200).json(putOrgData);
  } catch (error) {
    res.status(500).json(error);
  }
})


app.post('/api/addDonation', async (req, res) => {
  try {
    const { donatorName, donationAmount } = req.body;

    const newDonation = new Donation({
      donatorName: donatorName,
      donationAmount: parseInt(donationAmount),
    });
    const savedDonation = await newDonation.save();

    // Update bank balance
    const bankDetails = await bankDetailsAdapter.findOne({});
    bankDetails.balance += parseInt(donationAmount);
    await bankDetails.save();

    res.status(200).json(savedDonation);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/getDonations', async (req, res) => {
  try {
    const donationData = await Donation.find();
    res.json(donationData);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/editDonation/:id', async (req, res) => {
  const { donatorName, donationAmount } = req.body;
  const donationId = req.params.id;

  try {
    // Fetch the old donation details before updating
    const oldDonation = await Donation.findById(donationId);

    const donation = await Donation.findByIdAndUpdate(
      donationId,
      { donatorName, donationAmount },
      { new: true }
    );

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    // Update bank balance
    const bankDetails = await bankDetailsAdapter.findOne({});
    bankDetails.balance -= oldDonation.donationAmount;
    bankDetails.balance += parseInt(donationAmount);
    await bankDetails.save();

    res.status(200).json({ success: true, donation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/deleteDonation/:id', async (req, res) => {
  const donationId = req.params.id;

  try {
    // Delete donation
    const deletedDonation = await Donation.findByIdAndDelete(donationId);

    if (!deletedDonation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }
   // Update bank balance
   const bankDetails = await bankDetailsAdapter.findOne({});
   bankDetails.balance -= deletedDonation.donationAmount;
   await bankDetails.save();

    res.status(200).json(deletedDonation);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/getSpends',async(req,res) => {
  try {
    const fetchSpends = await spendsAdapter.find();
    res.status(200).json(fetchSpends);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post('/api/postSpends',async(req,res) => {
  try {
    const {spendsName,spendsAmount,spendsQuantity,spendsType,spendsOccassion} =  req.body;
    const postSpends = new spendsAdapter({
      spendsName:spendsName,
      spendsAmount:parseInt(spendsAmount),
      spendsQuantity:parseInt(spendsQuantity),
      spendsType:spendsType,
      spendsOccassion:spendsOccassion
    })
    await postSpends.save();

        // Update bank balance
        const bankDetails = await bankDetailsAdapter.findOne({});
        bankDetails.balance -= parseInt(spendsAmount);
        await bankDetails.save();
    
    res.status(200).json(postSpends);
  } catch (error) {
    res.status(500).json(error);
  }
})

app.put('/api/editSpends/:id', async (req, res) => {
  try {
    const { spendsName, spendsAmount, spendsQuantity, spendsType, spendsOccassion } = req.body;
    const spendsId = req.params.id;

    const oldSpends = await spendsAdapter.findById(spendsId);

    const putSpends = await spendsAdapter.findByIdAndUpdate(spendsId, {
      spendsName, spendsAmount, spendsType, spendsQuantity, spendsOccassion
    }, {
      new: true
    });

    if (!putSpends) {
      return res.status(404).json({ success: false, message: 'Spends not found' });
    }

    // Update bank balance
    const bankDetails = await bankDetailsAdapter.findOne({});
    bankDetails.balance -= oldSpends.spendsAmount;
    bankDetails.balance += parseInt(spendsAmount);
    await bankDetails.save();

    res.status(200).json({ success: true, putSpends });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});





app.delete('/api/deleteSpends/:id', async (req, res) => {
  try {
    const spendsId = req.params.id;
    const deleteSpends = await spendsAdapter.findByIdAndDelete(spendsId);

    if (!deleteSpends) {
      return res.status(404).json({ success: false, message: 'Spend not found' });
    }

    // Update bank balance
    const bankDetails = await bankDetailsAdapter.findOne({});
    bankDetails.balance += deleteSpends.spendsAmount;
    await bankDetails.save();

    res.status(200).json(deleteSpends);
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.get("/api/getMembers", async (req, res) => {
  try {
    const memberData = await memberAdapter.find();
    const membersWithImageURL = memberData.map((member) => {
      return {
        ...member._doc,
        memberImage: member.memberImage
          ? `/images/${member._id}`
          : null,
      };
    });
    res.status(200).json(membersWithImageURL);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/images/:id", async (req, res) => {
  try {
    const member = await memberAdapter.findById(req.params.id);
    res.set("Content-Type", "image/jpeg"); // Adjust the content type based on your image type
    res.send(member.memberImage);
  } catch (error) {
    res.status(500).json(error);
  }
});


app.post('/api/postMembers', upload.single('image'), async (req, res) => {
  try {
    const { memberName, memberAddress, memberPhoneNumber, memberRole } = req.body;
    const memberData = new memberAdapter({
      memberName: memberName,
      memberRole: memberRole,
      memberPhoneNumber: memberPhoneNumber,
      memberAddress: memberAddress,
      memberImage: req.file.buffer, // Save the image as buffer
    });
    await memberData.save();
    res.status(200).json(memberData);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post('/api/postMembersNoImage', upload.single('image'), async (req, res) => {
  try {
    const { memberName, memberAddress, memberPhoneNumber, memberRole } = req.body;

    let memberImage = null;

    // Check if req.file (image) is present
    if (req.file) {
      memberImage = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const memberData = new memberAdapter({
      memberName,
      memberRole,
      memberPhoneNumber,
      memberAddress,
      memberImage,
    });

    await memberData.save();

    res.status(200).json(memberData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.delete('/api/deleteMember/:id', async(req,res) => {
  try {
    const memberId = req.params.id;
    const memberData = await memberAdapter.findByIdAndDelete(memberId);
    res.status(200).json(memberData);
  } catch (error) {
    res.status(500).json(error);
  }
});



app.get('/api/getType',async(req,res) => {
  try {
    const typeData = await typeAdapter.find();
    res.status(200).json(typeData);
  } catch (error) {
    res.status(500).json(error);
  }
})
app.post('/api/postType',async(req,res) =>{
  try {
    const {typeName} = req.body;
    const typeData = new typeAdapter({
      typeName:typeName
    })
    await typeData.save();
    res.status(200).json(typeData);
  } catch (error) {
    res.status(500).json(error);
  }
})
app.delete('/api/deleteType/:id',async(req,res) =>{
  try {
    const typeId = req.params.id;
    const typeData = await typeAdapter.findByIdAndDelete(typeId);
    res.status(200).json(typeData);
  } catch (error) {
    res.status(500).json(error);
  }
})
app.put('/api/putType/:id',async(req,res) => {
  try {
    const typeId = req.params.id;
    const typeName = req.body;
    const typeData = await typeAdapter.findByIdAndUpdate(typeId,{
      typeName
    }, {
      new: true
    })
    res.status(200).json(typeData);
  } catch (error) {
    res.status(500).json(error);
  }
})

app.get('/api/getOccassion',async(req,res) => {
  try {
    const occassionData = await occasionsAdapter.find();
    res.status(200).json(occassionData);
  } catch (error) {
    res.status(500).json(error);
  }
})
app.post('/api/postOccassion',async(req,res) =>{
  try {
    const {occassionName} = req.body;
    const occassionData = new occasionsAdapter({
      occassionName:occassionName
    })
    await occassionData.save();
    res.status(200).json(occassionData);
  } catch (error) {
    res.status(500).json(error);
  }
})
app.delete('/api/deleteOccassion/:id',async(req,res) => {
  try {
    const occassionId = req.params.id;
    const deleteOccassion = await occasionsAdapter.findByIdAndDelete(occassionId);
    res.status(200).json(deleteOccassion);
  } catch (error) {
    res.status(500).json(error);
  }
})


app.get('/api/getMemberRole',async(req,res) => {
   try {
    const memberRole =  await memberRoleAdapter.find();
    res.status(200).json(memberRole);
   } catch (error) {
    res.status(500).json(error);
   }
})
app.post('/api/postMemberRole', async (req, res) => {
  try {
    const { memberRoleCat } = req.body;

    const memberRoleData = await memberRoleAdapter({ memberRoleCat });
    await memberRoleData.save();

    res.status(200).json(memberRoleData);
  } catch (error) {
    res.status(500).json(error);
  }
});

// Assuming you already have a function to establish the database connection
const connectToDatabase = async () => {
  try {
    await mongoose.connect('mongodb+srv://netstone360:aspire15@cluster0.phwldtn.mongodb.net/deepuDb?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Call the function to create default roles
    await createDefaultRoles();

    console.log('Connected to the database');
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
};

// Rest of your code...

// Create default roles when the server starts
const createDefaultRoles = async () => {
  try {
    // Check if default roles already exist
    const existingRoles = await memberRoleAdapter.find();

    if (existingRoles.length === 0) {
      const defaultRoles = ['President', 'Vice-President', 'Accountant'];

      for (const role of defaultRoles) {
        const defaultRoleData = new memberRoleAdapter({ memberRoleCat: role });
        await defaultRoleData.save();
      }

      console.log('Default roles created successfully');
    } else {
      console.log('Default roles already exist');
    }
  } catch (error) {
    console.error('Error creating default roles:', error);
  }
};

// Call the connectToDatabase function to establish the connection
connectToDatabase();

app.delete('/api/deleteMemberRole/:id',async(req,res) => {
  try {
    const memberRoleId = req.params.id;
    const deleteMember = await memberRoleAdapter.findByIdAndDelete(memberRoleId);
    res.status(200).json(deleteMember);
  } catch (error) {
    res.status(500).json(deleteMember);
  }
})

app.get('/api/getItemList',async(req,res) => {
  try {
    const getItemList = await  itemAdapter.find();
    res.status(200).json(getItemList);
  } catch (error) {
    res.status(500).json(error);
  }
});

app.post('/api/postItemList',async(req,res) => {
  try {
    const {itemName ,itemQty,itemType,itemOccassion} = req.body;
    const postItemList = new itemAdapter({
      itemName:itemName,
      itemQty:itemQty,
      itemType:itemType,
      itemOccassion:itemOccassion
    });
    await postItemList.save();
    res.status(200).json(postItemList);
  } catch (error) {
    res.status(500).json(error);
  }
})
app.put('/api/putItemList/:id',async(req,res) => {
  try {
    const itemListId = req.params.id;
    const {itemQty,itemName} = req.body;
    const updateItemList  =  await itemAdapter.findByIdAndUpdate(itemListId,{
      itemName:itemName,
      itemQty:itemQty
    });
    res.status(200).json(updateItemList);
  } catch (error) {
    res.status(500).json(error);
  }
})
app.delete('/api/deleteItemList/:id',async(req,res) => {
  try {
    const itemListId = req.params.id;
    const deleteItemList  = await itemAdapter.findByIdAndDelete(itemListId);
    res.status(200).json(deleteItemList);
  } catch (error) {
    res.status(500).json(error);
  }
})



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

