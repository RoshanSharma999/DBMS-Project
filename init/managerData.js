const bcrypt = require("bcrypt");
const managerData = [
  ["Alice Johnson", "alice.johnson@gmail.com", "9876543210", "aj123"],
  ["Ravi Mehta", "ravi.mehta@gmail.com", "9123456789", "rm123"],
  ["Sara Lee", "sara.lee@gmail.com", "9988776655", "sl123"],
  ["Kunal Patel", "kunal.patel@gmail.com", "9871234567", "kp123"],
  ["Emma Watson", "emma.watson@gmail.com", "9112233445", "ew123"],
  ["Aman Sharma", "aman.sharma@gmail.com", "9001122334", "as123"],
  ["Lily Chen", "lily.chen@gmail.com", "9812345678", "lc123"],
  ["Mohit Verma", "mohit.verma@gmail.com", "9090909090", "mv123"],
  ["Nina Roy", "nina.roy@gmail.com", "9898989898", "nr123"],
  ["David Kim", "david.kim@gmail.com", "9345678123", "dk123"],
  ["Virat", "virat123@gmail.com", "3984560378", "v123"]
];

(async () => {
  for(idv of managerData){
    idv[3] = await bcrypt.hash(idv[3], 5);
  }
})();

module.exports = managerData;
