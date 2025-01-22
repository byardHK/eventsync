import { Box, Button, Dialog, TextField, Grid2 } from "@mui/material";
import { useState } from "react";  
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

function ItemModal(prop: { itemsToParent: (data: Item[]) => void }) {
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [partialItems, setPartialItems] = useState<Item[]>([]);

    function createNewPartialItem() {
        const item: Item = {
            id: 1,
            description: "New Item", 
            amountNeeded: 0,
            quantityAccountedFor: 0,
            isFull: false,
            event: 1
        };
        setPartialItems([...partialItems, item]);
    }

    function changeItemQuantity(amount: number, index: number){
        const newPartialItems = [...partialItems];
        newPartialItems[index].amountNeeded += amount;
        if(newPartialItems[index].amountNeeded < 0){
            newPartialItems[index].amountNeeded = 0;
        }
        setPartialItems(newPartialItems);
    }

    function changeItemDescription(description: String, index: number){
        const newPartialItems = [...partialItems];
        newPartialItems[index].description = description;
        setPartialItems(newPartialItems);
    }

    function ItemRow(item: Item, index: number){
        return <Box
            display="flex"
            flexDirection="row"
            justifyContent="center"
        >
            <Box
                display="flex"
                width="50%"
                justifyContent="left"
                paddingLeft={3}
            >  
                <TextField 
                    onChange={(event) => changeItemDescription(event.target.value, index)}
                    defaultValue = {item.description}
                >
                    </TextField>
            </Box>
            <Box
                display="flex"
                width="50%" 
                justifyContent="right"
                gap={3}
            >
                <Button variant="contained" onClick={() => changeItemQuantity(-1, index)}>
                    <RemoveIcon></RemoveIcon>
                </Button>
                <h3>{item.amountNeeded}</h3>
                <Button variant="contained" onClick={() => changeItemQuantity(1, index)}>
                    <AddIcon></AddIcon>
                </Button>
            </Box>
            <Box
                display="flex"
                width="50%" 
                justifyContent="right"
                gap={3}
            >
                <Button variant="contained" 
                    onClick={() => setPartialItems(partialItems.splice(partialItems.findIndex((thisItem) => item.id = thisItem.id), 1))}>
                    <DeleteIcon></DeleteIcon>
                </Button>
            </Box>
        </Box>
    }

    return <>
        <Button 
            variant="outlined" 
            sx={{ minWidth: '40px', minHeight: '40px', padding: 0 }}
            onClick={handleOpen}
        >
            <AddIcon />
        </Button>
        <Dialog 
            onClose={handleClose} 
            open={open}
            fullScreen
        >
            <Box
                display="flex"
                flexDirection="column"
            >
                {partialItems.map((item, index) =>           
                    ItemRow(item,index)
                )}
                <Button onClick={createNewPartialItem}>
                    Add New Item
                </Button>
            </Box>
            <Button onClick={() => {prop.itemsToParent(partialItems); handleClose(); }}>Done</Button>
        </Dialog>
    </>
}

type Item = {
    id: number;
    description: String;
    amountNeeded: number;
    quantityAccountedFor: number;
    isFull: Boolean;
    event: number;
};

export default ItemModal