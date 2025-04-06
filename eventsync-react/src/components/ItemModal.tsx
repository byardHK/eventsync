import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, IconButton } from "@mui/material";
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
            id: partialItems.length + 1,
            description: "New Item", 
            amountNeeded: 1,
            quantityAccountedFor: 0,
            isFull: false,
            event: 1
        };
        setPartialItems([...partialItems, item]);
    }

    function changeItemQuantity(amount: number, index: number){
        const newPartialItems = [...partialItems];
        newPartialItems[index].amountNeeded += amount;
        if(newPartialItems[index].amountNeeded < 1){
            newPartialItems[index].amountNeeded = 1;
        }
        setPartialItems(newPartialItems);
    }

    function changeItemDescription(description: string, index: number){
        const newPartialItems = [...partialItems];
        newPartialItems[index].description = description;
        setPartialItems(newPartialItems);
    }

    function deleteItem(index: number){
        const newPartialItems = partialItems.filter((_, i) => i !== index);
        setPartialItems(newPartialItems);
    }

    function handleSave() {
        prop.itemsToParent(partialItems);
        handleClose();
    }

    return (
        <div>
            <Button 
                variant="contained"
                sx={{ color: "black", minWidth: '40px', minHeight: '40px', padding: 0 }}
                onClick={handleOpen}
                title="Edit Items"
            >
                <AddIcon/>
            </Button>
            <Dialog open={open} onClose={handleClose} fullWidth>
                <DialogTitle fontWeight="bold">Manage Items</DialogTitle>
                <DialogContent>
                    {partialItems.map((item, index) => (
                        <Box key={index} display="flex" alignItems="center" mb={2}>
                            <TextField
                                placeholder={item.description}
                                onChange={(e) => changeItemDescription(e.target.value, index)}
                                sx={{width: 350}}
                                margin="normal"
                            />
                            <IconButton onClick={() => changeItemQuantity(-1, index)}>
                                <RemoveIcon />
                            </IconButton>
                            <TextField
                                type="number"
                                value={item.amountNeeded}
                                onChange={(e) => changeItemQuantity(Number(e.target.value) - item.amountNeeded, index)}
                                inputProps={{ min: 1, style: { MozAppearance: 'textfield' } }}
                                sx={{
                                    '& input[type=number]': {
                                        MozAppearance: 'textfield',
                                    },
                                    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                                        WebkitAppearance: 'none',
                                        margin: 0,
                                    },
                                }}
                                margin="normal"
                                style={{ width: '150px' }}
                            />
                            <IconButton onClick={() => changeItemQuantity(1, index)}>
                                <AddIcon />
                            </IconButton>
                            <IconButton onClick={() => deleteItem(index)}>
                                <DeleteIcon style={{ color: '#ad1f39'}} />
                            </IconButton>
                        </Box>
                    ))}
                    <Button 
                        variant="contained"
                        sx={{ backgroundColor: "#1c284c", color: "black", minWidth: '40px', minHeight: '40px', padding: 0 }}
                        onClick={createNewPartialItem}
                    >
                        <AddIcon sx={{color: "white"}}/>
                    </Button>
                </DialogContent>
                <Box display="flex" flexDirection="row" justifyContent="space-between" padding={2}>
                    <Button sx={{backgroundColor: "#1c284c"}} variant="contained" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button sx={{backgroundColor: "#1c284c"}} variant="contained" onClick={handleSave}>
                        Save
                    </Button>
                </Box>
            </Dialog>
        </div>
    );
}

type Item = {
    id: number;
    description: string;
    amountNeeded: number;
    quantityAccountedFor: number;
    isFull: Boolean;
    event: number;
};

export default ItemModal